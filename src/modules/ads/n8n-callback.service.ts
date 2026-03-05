import { AdStatus, MediaType, UsageType } from "@prisma/client";
import Logger from "../../common/logging/logger";
import { prisma } from "../../config/database.config";
import { creditsService } from "../billing/credits.service";
import { adsService } from "./ads.service";

export interface N8NCallbackPayload {
  adId: string;
  isDraft?: boolean;
  status: "success" | "error" | string;
  taskType: string;
  mediaType?: MediaType;
  error?: string;
  url?: string;
  imageUrls?: string[];
  videoUrls?: string[];
  storyboard?: string;
  storyBoard?: string;
  productDescription?: string;
  result?: any;
  scenes?: any[];
}

// ─────────────────────────────────────────────────────────────────────────────
// N8NCallbackService
//
// Flow:
//  • Intermediate tasks (BASE_IMAGE, MODEL_IMAGE, STORYBOARD, ALL_SCENES,
//    SINGLE_SCENE) → always update AdDraft, set currentTask status
//  • FINAL_VIDEO success → promoteDraftToAd (Ad created, draft deleted),
//    update Ad, deduct credits, emit REDIRECT + COMPLETED
//  • Any error → update draft/ad, set currentTask status = FAILED, emit FAILED
// ─────────────────────────────────────────────────────────────────────────────

export class N8NCallbackService {
  private logger = Logger;

  // ── Entry Point ────────────────────────────────────────────────────────────

  async handleCallback(payload: N8NCallbackPayload): Promise<void> {
    const { adId, status, error, taskType } = payload;
    let { isDraft } = payload;

    this.logger.info(
      `[N8NCallback] RECEIVED — adId=${adId} task=${taskType} status=${status}`,
      { hasResult: !!payload.result, hasUrl: !!payload.url, isDraft },
    );

    // ── Resiliency Guard ─────────────────────────────────────────────────────
    // If isDraft is not explicitly provided by n8n (common if payload sync
    // is lost), we check the DB to see where this ID lives.
    if (isDraft === undefined) {
      const draftExists = await prisma.adDraft.findUnique({
        where: { id: adId },
        select: { id: true },
      });
      isDraft = !!draftExists;
      this.logger.info(
        `[N8NCallback] Auto-detected isDraft=${isDraft} for adId=${adId}`,
      );
    }

    if (status === "error") {
      await this.handleFailure(
        adId,
        !!isDraft,
        error || "Unknown error from n8n",
        taskType,
      );
      return;
    }

    await this.handleSuccess(adId, !!isDraft, payload);
  }

  // ── Success Router ─────────────────────────────────────────────────────────

  private async handleSuccess(
    adId: string,
    isDraft: boolean,
    payload: N8NCallbackPayload,
  ): Promise<void> {
    const { taskType } = payload;

    // log the payload
    this.logger.info(
      `[N8NCallback] Payload (handleSuccess): ${JSON.stringify(payload)}`,
    );

    // log the taskType
    this.logger.info(`[N8NCallback] Task type (handleSuccess): ${taskType}`);

    switch (taskType) {
      case "BASE_IMAGE":
      case "MODEL_IMAGE":
        await this.handleImageCallback(adId, isDraft, payload);
        break;

      case "STORYBOARD":
      case "ALL_SCENES":
        await this.handleStoryboardCallback(adId, isDraft, payload);
        break;

      case "SINGLE_SCENE":
        await this.handleSingleSceneCallback(adId, isDraft, payload);
        break;

      case "FINAL_VIDEO":
        await this.handleFinalVideoCallback(adId, isDraft, payload);
        break;

      default:
        this.logger.warn(`[N8NCallback] No handler for taskType: ${taskType}`);
    }
  }

  // ── BASE_IMAGE / MODEL_IMAGE ───────────────────────────────────────────────
  // Updates AdDraft with the returned image URL and marks task COMPLETED.
  // Does NOT create an Ad — that only happens when FINAL_VIDEO succeeds.

  private async handleImageCallback(
    adId: string,
    isDraft: boolean,
    payload: N8NCallbackPayload,
  ): Promise<void> {
    const {
      taskType,
      result,
      imageUrls,
      storyBoard,
      storyboard,
      productDescription,
    } = payload as any;

    // log the payload
    this.logger.info(
      `[N8NCallback] Payload (BASE_IMAGE/MODEL_IMAGE): ${JSON.stringify(payload)}`,
    );

    if (isDraft) {
      await prisma.adDraft.update({
        where: { id: adId },
        data: {
          status: "PROCESSING" as AdStatus,
          currentTask: { type: taskType, status: "COMPLETED" },
          ...(taskType === "BASE_IMAGE"
            ? {
                baseImageUrl: imageUrls?.[0] || result?.imageUrls?.[0],
                storyboard: storyBoard || result?.storyboard || undefined,
                productDescription:
                  productDescription || result?.productDescription || undefined,
              }
            : { modelImageUrl: imageUrls?.[0] || result?.imageUrls?.[0] }),
        } as any,
      });
    } else {
      // Non-draft (image ad flow)
      await prisma.ad.update({
        where: { id: adId },
        data: {
          currentTask: { type: taskType, status: "COMPLETED" },
          ...(taskType === "BASE_IMAGE"
            ? { baseImageUrl: imageUrls[0] || result?.imageUrls?.[0] }
            : { modelImageUrl: imageUrls[0] || result?.imageUrls?.[0] }),
        } as any,
      });
    }

    adsService.emitAdUpdate(adId, {
      status: "COMPLETED",
      url: imageUrls?.[0] || result?.imageUrls?.[0],
      taskType: taskType,
      storyboard: storyBoard || result?.storyboard || undefined,
      productDescription:
        productDescription || result?.productDescription || undefined,
    });

    this.logger.info(
      `[N8NCallback] ${taskType} done — adId=${adId} url=${imageUrls?.[0] || result?.imageUrls?.[0]}`,
    );
  }

  // ── STORYBOARD / ALL_SCENES ───────────────────────────────────────────────
  // Updates AdDraft with scene images+descriptions. No video yet.
  // Scenes are image frames with textual descriptions used by the final step.

  private async handleStoryboardCallback(
    adId: string,
    isDraft: boolean,
    payload: N8NCallbackPayload,
  ): Promise<void> {
    const { imageUrls, result, taskType } = payload as any;
    const finalImageUrls = imageUrls || result?.imageUrls || [];

    // log the payload
    this.logger.info(
      `[N8NCallback] Payload (STORYBOARD/ALL_SCENES): ${JSON.stringify(payload)}`,
    );

    const scenes = finalImageUrls.map((url: string, index: number) => ({
      id: String(index + 1),
      imageUrl: url,
      description: `Scene ${index + 1}`,
    }));

    if (isDraft) {
      await prisma.adDraft.update({
        where: { id: adId },
        data: {
          scenes: scenes,
        } as any,
      });
    } else {
      await prisma.ad.update({
        where: { id: adId },
        data: {
          scenes: scenes,
        } as any,
      });
    }

    adsService.emitAdUpdate(adId, {
      status: "COMPLETED",
      scenes: scenes,
      taskType: taskType as any,
    });

    this.logger.info(
      `[N8NCallback] ${taskType} done — adId=${adId} scenes=${scenes.length}`,
    );
  }

  // ── SINGLE_SCENE ──────────────────────────────────────────────────────────
  // Replaces one scene's imageUrl in the scenes array (still in AdDraft).

  private async handleSingleSceneCallback(
    adId: string,
    isDraft: boolean,
    payload: N8NCallbackPayload,
  ): Promise<void> {
    const { url, result } = payload;
    const sceneUrl = url || result?.url || result?.imageUrl;
    const targetSceneId =
      result?.targetSceneId || (payload as any).targetSceneId;

    // log the payload
    this.logger.info(
      `[N8NCallback] Payload (SINGLE_SCENE): ${JSON.stringify(payload)}`,
    );

    // Fetch current scenes from the correct table
    let currentScenes: any[] = [];

    if (isDraft) {
      const draft = await prisma.adDraft.findUnique({
        where: { id: adId },
        select: { scenes: true },
      });
      currentScenes = (draft?.scenes as any[]) ?? [];
    } else {
      const ad = await prisma.ad.findUnique({
        where: { id: adId },
        select: { scenes: true },
      });
      currentScenes = (ad?.scenes as any[]) ?? [];
    }

    const updatedScenes = currentScenes.map((s) =>
      s.id === targetSceneId ? { ...s, imageUrl: sceneUrl } : s,
    );

    if (isDraft) {
      await prisma.adDraft.update({
        where: { id: adId },
        data: {
          scenes: updatedScenes,
          status: "PROCESSING" as AdStatus,
        } as any,
      });
    } else {
      await prisma.ad.update({
        where: { id: adId },
        data: {
          scenes: updatedScenes,
          status: "PROCESSING",
        } as any,
      });
    }

    adsService.emitAdUpdate(adId, {
      status: "COMPLETED",
      sceneId: targetSceneId,
      url: sceneUrl,
      taskType: "SINGLE_SCENE",
    });

    this.logger.info(
      `[N8NCallback] SINGLE_SCENE done — adId=${adId} sceneId=${targetSceneId}`,
    );
  }

  // ── FINAL_VIDEO ───────────────────────────────────────────────────────────
  // This is where the Ad is finally created from the AdDraft.
  // Steps: promoteDraftToAd → update Ad with videoUrl → deduct credits → SSE.

  private async handleFinalVideoCallback(
    adId: string,
    isDraft: boolean,
    payload: N8NCallbackPayload,
  ): Promise<void> {
    const { url, result, mediaType, videoUrls, imageUrls } = payload;
    const finalUrl =
      url ||
      result?.url ||
      result?.videoUrl ||
      result?.imageUrl ||
      videoUrls?.[0] ||
      imageUrls?.[0] ||
      result?.videoUrls?.[0] ||
      result?.imageUrls?.[0];

    // log the payload
    this.logger.info(
      `[N8NCallback] Payload (FINAL_VIDEO): ${JSON.stringify(payload)}`,
    );

    let targetAdId = adId;

    Logger.info(
      `[N8NCallback] isDraft: ${isDraft} | targetAdId: ${targetAdId}`,
    );
    Logger.info(`[N8NCallback] finalUrl: ${finalUrl}`);
    Logger.info(`[N8NCallback] mediaType: ${mediaType}`);
    Logger.info(`[N8NCallback] videoUrls: ${JSON.stringify(videoUrls)}`);
    Logger.info(`[N8NCallback] imageUrls: ${JSON.stringify(imageUrls)}`);
    Logger.info(`[N8NCallback] result: ${JSON.stringify(result)}`);

    if (isDraft) {
      // Promote draft → final Ad (creates Ad record, deletes AdDraft)
      const ad = await adsService.promoteDraftToAd(adId);
      Logger.info(
        `[N8NCallback] promoteDraftToAd result: ${JSON.stringify(ad?.id)}`,
      );
      if (!ad) {
        this.logger.error(
          `[N8NCallback] promoteDraftToAd returned null for draftId=${adId}`,
        );
        return;
      }
      targetAdId = ad.id;

      Logger.info(`[N8NCallback] Draft ${adId} promoted → Ad ${targetAdId}`);

      //
      // adsService.emitAdUpdate(adId, {
      //   status: "REDIRECT" as any,
      //   newId: targetAdId,
      //   adId: targetAdId,
      //   taskType: payload.taskType,
      // });

      Logger.info(
        `[N8NCallback] REDIRECT emitted on old draftId=${adId} → newId=${targetAdId}`,
      );
    }

    // Determine update data based on media type
    const isVideo =
      mediaType === "VIDEO" ||
      (!mediaType &&
        (finalUrl?.includes(".mp4") || finalUrl?.includes(".mov")));

    const updateData: any = {
      status: "COMPLETED" as AdStatus,
      videoUrl: finalUrl,
    };

    const updatedAd = await prisma.ad.update({
      where: { id: targetAdId },
      data: updateData,
    });

    Logger.info(
      `[N8NCallback] Ad ${targetAdId} updated with status=COMPLETED url=${finalUrl}`,
    );

    const completedPayload = {
      status: "COMPLETED" as const,
      url: finalUrl,
      taskType: payload.taskType,
      adId: updatedAd?.id as string,
      ...updateData,
    };

    // Emit COMPLETED on the new Ad ID channel (primary)
    adsService.emitAdUpdate(targetAdId, completedPayload);
    Logger.info(`[N8NCallback] COMPLETED emitted on targetAdId=${targetAdId}`);

    // Also emit on the old draftId channel — the frontend may still be connected
    // to it while the SSE reconnection to targetAdId is in flight.
    if (isDraft && targetAdId !== adId) {
      adsService.emitAdUpdate(adId, completedPayload);
      Logger.info(
        `[N8NCallback] COMPLETED also emitted on old draftId=${adId}`,
      );
    }

    // Deduct credits (non-blocking)
    const creditMediaType = isVideo ? "VIDEO" : "IMAGE";
    await this.deductCredits(targetAdId, creditMediaType);

    // Clean up the draft
    await prisma.adDraft
      .delete({ where: { id: payload?.adId } })
      .catch((err) =>
        Logger.warn(
          `[AdsService] Failed to delete draft ${payload?.adId}: ${err.message}`,
        ),
      );

    this.logger.info(
      `[N8NCallback] FINAL_VIDEO done — adId=${targetAdId} url=${finalUrl}`,
    );
  }

  // ── Failure Handler ────────────────────────────────────────────────────────

  private async handleFailure(
    adId: string,
    isDraft: boolean,
    error: string,
    taskType: string,
  ): Promise<void> {
    this.logger.error(
      `[N8NCallback] FAILURE — adId=${adId} task=${taskType} error=${error}`,
    );

    try {
      if (isDraft) {
        await prisma.adDraft.update({
          where: { id: adId },
          data: {
            status: "FAILED" as AdStatus,
            metadata: { error, failedAt: new Date().toISOString(), taskType },
          } as any,
        });
      } else {
        await prisma.ad.update({
          where: { id: adId },
          data: {
            status: "FAILED",
            metadata: { error, failedAt: new Date().toISOString(), taskType },
          },
        });
      }
    } catch (dbErr: any) {
      this.logger.error(
        `[N8NCallback] DB update failed during failure handler: ${dbErr.message}`,
      );
    }

    adsService.emitAdUpdate(adId, {
      status: "FAILED",
      error,
      taskType,
    });
  }

  // ── Credit Deduction ───────────────────────────────────────────────────────

  private async deductCredits(adId: string, mediaType: string): Promise<void> {
    try {
      const ad = await prisma.ad.findUnique({
        where: { id: adId },
        select: { userId: true },
      });
      if (!ad) return;

      const creditCost = mediaType === "VIDEO" ? 10 : 1;
      await creditsService.deductCredits(
        ad.userId,
        creditCost,
        UsageType.AD_GENERATION,
        `Ad Generation: ${adId}`,
      );

      this.logger.info(
        `[N8NCallback] Deducted ${creditCost} credits for user ${ad.userId}`,
      );
    } catch (err: any) {
      this.logger.error(
        `[N8NCallback] Failed to deduct credits for adId=${adId}: ${err.message}`,
      );
    }
  }
}

export const n8nCallbackService = new N8NCallbackService();
