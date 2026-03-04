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
    const { adId, isDraft, status, error, taskType } = payload;

    this.logger.info(
      `[N8NCallback] RECEIVED — adId=${adId} task=${taskType} status=${status}`,
      { hasResult: !!payload.result, hasUrl: !!payload.url, isDraft },
    );

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
    const { taskType, url, result } = payload;
    const imageUrl = url || result?.url || result?.imageUrl;
    const storyboard = result?.description || result?.storyboard;
    const productDescription = result?.productDescription;

    if (isDraft) {
      const taskStatus: AdStatus = "PENDING";
      await prisma.adDraft.update({
        where: { id: adId },
        data: {
          status: taskStatus,
          currentTask: { name: taskType, status: "COMPLETED" },
          ...(taskType === "BASE_IMAGE"
            ? {
                baseImageUrl: imageUrl,
                storyboard: storyboard || undefined,
                videoScript: productDescription
                  ? { type: "TEXT", content: productDescription }
                  : undefined,
              }
            : { modelImageUrl: imageUrl }),
        } as any,
      });
    } else {
      // Non-draft (image ad flow)
      await prisma.ad.update({
        where: { id: adId },
        data: {
          status: "PENDING",
          ...(taskType === "BASE_IMAGE"
            ? { baseImageUrl: imageUrl }
            : { modelImageUrl: imageUrl }),
        } as any,
      });
    }

    const sseEvent =
      taskType === "BASE_IMAGE" ? "BASE_IMAGE_READY" : "MODEL_READY";
    adsService.emitAdUpdate(adId, sseEvent as any, {
      url: imageUrl,
      taskType,
      storyboard: storyboard || undefined,
      productDescription: productDescription || undefined,
    });

    this.logger.info(
      `[N8NCallback] ${taskType} done — adId=${adId} url=${imageUrl}`,
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
    const { scenes, result, taskType } = payload;
    const finalScenes = scenes || result?.scenes || [];
    const storyboard = result?.description || result?.storyboard;
    const productDescription = result?.productDescription;

    if (isDraft) {
      await prisma.adDraft.update({
        where: { id: adId },
        data: {
          scenes: finalScenes,
          storyboard: storyboard || undefined,
          currentTask: { name: taskType, status: "COMPLETED" },
          status: "PENDING" as AdStatus,
          videoScript: productDescription
            ? { type: "TEXT", content: productDescription }
            : undefined,
        } as any,
      });
    } else {
      await prisma.ad.update({
        where: { id: adId },
        data: {
          scenes: finalScenes,
          storyboard: storyboard || undefined,
          status: "PENDING",
          videoScript: productDescription
            ? { type: "TEXT", content: productDescription }
            : undefined,
        } as any,
      });
    }

    adsService.emitAdUpdate(adId, "PENDING", {
      scenes: finalScenes,
      taskType,
      storyboard: storyboard || undefined,
      productDescription: productDescription || undefined,
    });

    this.logger.info(
      `[N8NCallback] ${taskType} done — adId=${adId} scenes=${finalScenes.length}`,
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
          currentTask: { name: "SINGLE_SCENE", status: "COMPLETED" },
          status: "PENDING" as AdStatus,
        } as any,
      });
    } else {
      await prisma.ad.update({
        where: { id: adId },
        data: { scenes: updatedScenes, status: "PENDING" } as any,
      });
    }

    adsService.emitAdUpdate(adId, "PENDING", {
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
    const { url, result, mediaType } = payload;
    const finalUrl = url || result?.url || result?.videoUrl || result?.imageUrl;

    let targetAdId = adId;

    if (isDraft) {
      // Promote draft → final Ad (creates Ad record, deletes AdDraft)
      const ad = await adsService.promoteDraftToAd(adId);
      if (!ad) {
        this.logger.error(
          `[N8NCallback] promoteDraftToAd returned null for draftId=${adId}`,
        );
        return;
      }
      targetAdId = ad.id;
      this.logger.info(
        `[N8NCallback] Draft ${adId} promoted → Ad ${targetAdId}`,
      );
    }

    // Determine update data based on media type
    const isVideo =
      mediaType === "VIDEO" ||
      (!mediaType &&
        (finalUrl?.includes(".mp4") || finalUrl?.includes(".mov")));

    const updateData: any = {
      status: "COMPLETED" as AdStatus,
      ...(isVideo ? { videoUrl: finalUrl } : { imageUrl: finalUrl }),
    };

    await prisma.ad.update({ where: { id: targetAdId }, data: updateData });

    // Emit REDIRECT on old draftId so frontend SSE reconnects to new Ad ID
    if (isDraft && targetAdId !== adId) {
      adsService.emitAdUpdate(adId, "COMPLETED" as any, {
        taskType: payload.taskType,
        status: "REDIRECT",
        newId: targetAdId,
        adId: targetAdId,
      });
    }

    // Emit COMPLETED on new Ad ID
    adsService.emitAdUpdate(targetAdId, "COMPLETED", {
      url: finalUrl,
      taskType: payload.taskType,
      adId: targetAdId,
      ...updateData,
    });

    // Deduct credits (non-blocking)
    const creditMediaType = isVideo ? "VIDEO" : "IMAGE";
    await this.deductCredits(targetAdId, creditMediaType);

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
            currentTask: { name: taskType, status: "FAILED" },
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

    adsService.emitAdUpdate(adId, "FAILED", { error, taskType });
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
