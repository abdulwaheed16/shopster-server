import { AdStatus, UsageType } from "@prisma/client";
import { ApiError } from "../../common/errors/api-error";
import Logger from "../../common/logging/logger";
import { prisma } from "../../config/database.config";
import { N8NCallbackPayload } from "../ai/interfaces/n8n-callback.types";
import { adsService } from "./ads.service";
import { AD_COSTS } from "./constants/ad-costs";

/**
 * N8NCallbackService — Single-Responsibility service for processing
 * inbound n8n webhook callbacks.
 *
 * Responsibilities (SRP):
 *  1. Validate the incoming payload
 *  2. Update the Ad record in the database
 *  3. Emit the SSE event so connected clients receive the result
 *
 * The controller delegates entirely to this service (DIP), keeping
 * itself free of business logic and direct DB access.
 */
export class N8NCallbackService {
  /**
   * Processes an inbound n8n callback payload end-to-end.
   *
   * @throws {ApiError} 400 if `adId` is missing from the payload
   */
  async handleCallback(payload: N8NCallbackPayload): Promise<void> {
    const {
      adId,
      status,
      imageUrls,
      videoUrls,
      error: errorMsg,
      mediaType,
    } = payload;

    if (!adId) {
      throw ApiError.badRequest("adId is required in the callback payload");
    }

    Logger.info(
      `[N8NCallbackService] Received callback for ad ${adId}: status=${status}`,
    );

    // Fetch current status to ensure we haven't already cancelled this ad
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      select: { status: true },
    });

    if (!ad) {
      Logger.warn(`[N8NCallbackService] Ad ${adId} not found in database`);
      return;
    }

    if (ad.status === ("CANCELLED" as AdStatus)) {
      Logger.info(
        `[N8NCallbackService] Ad ${adId} was already CANCELLED. Ignoring callback.`,
      );
      return;
    }

    const isSuccess =
      status === "COMPLETED" ||
      status === "SUCCESS" ||
      !!imageUrls?.length ||
      !!videoUrls?.length;

    if (isSuccess) {
      await this.handleSuccess(adId, { imageUrls, videoUrls, mediaType });
    } else {
      await this.handleFailure(adId, errorMsg);
    }
  }

  private async handleSuccess(
    adId: string,
    result: Pick<N8NCallbackPayload, "imageUrls" | "videoUrls" | "mediaType">,
  ): Promise<void> {
    const { imageUrls, videoUrls, mediaType } = result;

    const isVideo =
      mediaType === "VIDEO" || (!mediaType && !!videoUrls?.length);

    const urls = (isVideo ? videoUrls : imageUrls) ?? [];
    const primaryUrl = urls[0];

    await prisma.ad.update({
      where: { id: adId },
      data: {
        status: "COMPLETED" as AdStatus,
        ...(isVideo
          ? { videoUrl: primaryUrl, videoUrls: urls }
          : { imageUrl: primaryUrl, imageUrls: urls }),
      },
    });

    adsService.emitAdUpdate(adId, "COMPLETED" as AdStatus, {
      url: primaryUrl,
      mediaType: mediaType ?? (isVideo ? "VIDEO" : "IMAGE"),
      ...(isVideo ? { videoUrls: urls } : { imageUrls: urls }),
    });

    Logger.info(
      `[N8NCallbackService] Ad ${adId} marked COMPLETED — primaryUrl: ${primaryUrl}`,
    );

    // Fetch user ID for credit deduction
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      select: { userId: true },
    });

    if (ad?.userId) {
      const adCost = AD_COSTS[mediaType || "IMAGE"];
      const { billingService } = await import("../billing/billing.service");
      await billingService
        .checkAndDeductCredits(
          ad.userId,
          adCost,
          UsageType.AD_GENERATION,
          `Ad Generation (Async): ${adId}`,
        )
        .catch((err) => {
          Logger.error(
            `[N8NCallbackService] Credit deduction failed for ${ad.userId}:`,
            err.message,
          );
        });
    }
  }

  private async handleFailure(adId: string, errorMsg?: string): Promise<void> {
    const failReason =
      errorMsg ?? "n8n workflow failed without an error message";

    await prisma.ad.update({
      where: { id: adId },
      data: {
        status: "FAILED" as AdStatus,
        metadata: {
          error: failReason,
          failedAt: new Date().toISOString(),
        },
      },
    });

    adsService.emitAdUpdate(adId, "FAILED" as AdStatus, { error: failReason });

    Logger.warn(`[N8NCallbackService] Ad ${adId} marked FAILED: ${failReason}`);
  }
}

export const n8nCallbackService = new N8NCallbackService();
