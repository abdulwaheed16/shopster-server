import { AdStatus, MediaType, UsageType } from "@prisma/client";
import axios from "axios";
import Logger from "../../../common/logging/logger";
import { prisma } from "../../../config/database.config";

import { adsService } from "../../../modules/ads/ads.service";
import { AD_COSTS } from "../../../modules/ads/constants/ad-costs";
import { AI_PROVIDERS } from "../../../modules/ai/ai.constants";
import { aiService } from "../../../modules/ai/ai.service";
import { billingService } from "../../../modules/billing/billing.service";
import { IStorageService } from "../../../modules/upload/interfaces/storage.interface";
import { FinalVideoJobData } from "../types/job-data.types";
import { IAdProcessor, ProcessorResult } from "../types/processor.interface";

/**
 * FinalVideoProcessor — Strategy for FINAL_VIDEO task
 *
 * Sends to n8n: adId, baseImage?, scenes[], aspectRatio, duration?,
 *               videoScript?, templateId?, modelImage?, productImages?,
 *               callbackUrl (injected by N8NBaseProvider), timestamp
 *
 * On success:
 * - If isDraft → promotes draft to Ad, saves URL, deducts credits
 * - If already an Ad → updates directly, deducts credits
 */
export class FinalVideoProcessor implements IAdProcessor<FinalVideoJobData> {
  constructor(private readonly storageService: IStorageService) {}

  async handle(data: FinalVideoJobData): Promise<ProcessorResult> {
    const { adId, userId, isDraft, mediaType, scenes } = data;

    Logger.info(
      `[FinalVideoProcessor] Starting — adId=${adId} mediaType=${mediaType}`,
    );
    Logger.info(`[FinalVideoProcessor] Payload:`, {
      isDraft,
      scenesCount: scenes?.length,
    });

    // Fetch full context from DB to ensure consistency
    const draft = isDraft
      ? await prisma.adDraft.findUnique({ where: { id: adId } })
      : await prisma.ad.findUnique({ where: { id: adId } });

    if (!draft) {
      throw new Error(`[FinalVideoProcessor] Draft/Ad not found: ${adId}`);
    }

    const payload = {
      ...data,
      taskType: "FINAL_VIDEO",
      categoryName:
        (data as any).categoryName || (draft as any).categoryName || "",
      adType: (data as any).adType || (draft as any).adType || "",
      productDescription:
        (data as any).productDescription ||
        (draft as any).productDescription ||
        "",
      baseImage: (data as any).baseImage || (draft as any).baseImageUrl || "",
      storyboard: (data as any).storyboard || (draft as any).storyboard || "",
      duration: (data as any).duration || 10,
    };

    const generationResults = await aiService
      .generateVideo(payload as any, AI_PROVIDERS.N8N)
      .then((res) => ({
        url: res?.videoUrl,
        metadata: res?.metadata,
        pending: (res?.metadata as any)?.pending,
      }));

    // Async path — await n8n callback
    if (generationResults?.pending) {
      adsService.emitAdUpdate(adId, {
        status: "PROCESSING",
        taskType: "FINAL_VIDEO",
      });
      Logger.info(
        `[FinalVideoProcessor] Async — awaiting n8n callback for ${adId}`,
      );
      return { success: true, adId, async: true, taskType: "FINAL_VIDEO" };
    }

    // Sync path
    const primaryUrl = generationResults?.url ?? "";
    const allUrls = generationResults?.url ?? "";
    Logger.info(`[FinalVideoProcessor] Sync result — url=${primaryUrl}`);

    const urlFields: any =
      mediaType === MediaType.VIDEO
        ? { videoUrl: primaryUrl, videoUrls: allUrls }
        : { imageUrl: primaryUrl, imageUrls: allUrls };

    let targetAdId = adId;

    if (isDraft) {
      // Promote draft → Ad
      const finalAd = await adsService.promoteDraftToAd(adId);

      if (!finalAd) {
        Logger.warn(
          `[FinalVideoProcessor] promoteDraftToAd returned null for ${adId}`,
        );
        return { success: false, adId };
      }
      targetAdId = finalAd.id;
    }

    await prisma.adDraft.update({
      where: { id: adId },
      data: { status: AdStatus.COMPLETED, ...urlFields },
    });

    adsService.emitAdUpdate(targetAdId, {
      status: "COMPLETED",
      url: primaryUrl,
      mediaType,
      adId: targetAdId,
      ...urlFields,
      taskType: "FINAL_VIDEO",
    });

    await this.deductCredits(userId, targetAdId, mediaType);

    // Background storage upload (non-blocking)
    // this.uploadToStorageInBackground(targetAdId, allUrls, mediaType).catch(
    //   (err) =>
    //     Logger.warn(
    //       `[FinalVideoProcessor] Background upload failed: ${err.message}`,
    //     ),
    // );

    Logger.info(`[FinalVideoProcessor] Process completed — adId=${targetAdId}`);
    return { success: true, adId: targetAdId, url: primaryUrl };
  }

  // ────────────────────────────────────────────────────────────
  // Private helpers
  // ────────────────────────────────────────────────────────────

  private async deductCredits(
    userId: string,
    adId: string,
    mediaType: MediaType,
  ): Promise<void> {
    const adCost = AD_COSTS[mediaType];
    await billingService
      .checkAndDeductCredits(
        userId,
        adCost,
        UsageType.AD_GENERATION,
        `Ad Generation: ${adId}`,
      )
      .catch((err) =>
        Logger.error(
          `[FinalVideoProcessor] Credit deduction failed: ${err.message}`,
        ),
      );
  }

  private async downloadAsset(url: string): Promise<Buffer> {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(response.data);
  }

  private async uploadToStorageInBackground(
    adId: string,
    urls: string[],
    mediaType: MediaType,
  ): Promise<void> {
    const isVideo = mediaType === MediaType.VIDEO;
    const uploaded = await Promise.all(
      urls.map(async (url, i) => {
        try {
          const buffer = await this.downloadAsset(url);
          return await this.storageService.upload(buffer, {
            publicId: `ad_${adId}_v${i}_${Date.now()}`,
            folder: `ads/${adId}`,
            resourceType: isVideo ? "video" : "image",
          });
        } catch {
          return null;
        }
      }),
    );

    const saved = uploaded.filter(Boolean).map((r) => (r as any).url as string);
    if (saved.length > 0) {
      await prisma.ad.update({
        where: { id: adId },
        data: isVideo
          ? { videoUrl: saved[0], videoUrls: saved }
          : { imageUrl: saved[0], imageUrls: saved },
      });
      Logger.info(
        `[FinalVideoProcessor] Background upload done — ${saved.length} files`,
      );
    }
  }
}
