import Logger from "../../../common/logging/logger";
import { prisma } from "../../../config/database.config";

import { adsService } from "../../../modules/ads/ads.service";
import { AI_PROVIDERS } from "../../../modules/ai/ai.constants";
import { aiService } from "../../../modules/ai/ai.service";
import { IStorageService } from "../../../modules/upload/interfaces/storage.interface";
import { SingleSceneJobData } from "../types/job-data.types";
import { IAdProcessor, ProcessorResult } from "../types/processor.interface";

/**
 * SingleSceneProcessor — Strategy for SINGLE_SCENE task
 *
 * Sends: adId, targetSceneId, assembledPrompt, baseImage?,
 *        callbackUrl (injected by N8NBaseProvider), timestamp
 *
 * On success: patches the one scene inside the scenes[] array and saves.
 */
export class SingleSceneProcessor implements IAdProcessor<SingleSceneJobData> {
  constructor(private readonly storageService: IStorageService) {}

  async handle(data: SingleSceneJobData): Promise<ProcessorResult> {
    const {
      adId,
      isDraft,
      targetSceneId,
      assembledPrompt,
      baseImage,
      mediaType,
    } = data;

    Logger.info(
      `[SingleSceneProcessor] Starting — adId=${adId} sceneId=${targetSceneId}`,
    );
    Logger.info(`[SingleSceneProcessor] Payload:`, {
      targetSceneId,
      prompt: assembledPrompt,
      baseImage: !!baseImage,
    });

    const userPrompt = data.userPrompt || data.assembledPrompt;

    const payload = {
      adId,
      isDraft,
      imageUrls: [baseImage].filter(Boolean),
      userPrompt: userPrompt, // Standardized name
      prompt: userPrompt, // Legacy fallback
      targetSceneId,
      taskType: "SINGLE_SCENE" as const,
      mediaType: "IMAGE" as const,
    };

    const result = await aiService.generateImage(payload, AI_PROVIDERS.N8N);

    // Async path
    if ((result as any)?.metadata?.pending) {
      Logger.info(
        `[SingleSceneProcessor] Async — awaiting n8n callback for ${adId}`,
      );
      adsService.emitAdUpdate(adId, {
        status: "PROCESSING",
        taskType: "SINGLE_SCENE",
        sceneId: targetSceneId,
      });
      return { success: true, adId, async: true, taskType: "SINGLE_SCENE" };
    }

    // Sync path — patch the specific scene in the array
    const sceneUrl = (result as any).videoUrl ?? (result as any).url ?? "";
    Logger.info(`[SingleSceneProcessor] Sync result — sceneUrl=${sceneUrl}`);

    let updatedScenes: any[] = [];

    if (isDraft) {
      const draft = await prisma.adDraft.findUnique({
        where: { id: adId },
        select: { scenes: true },
      });
      updatedScenes = ((draft?.scenes as any[]) ?? []).map((s) =>
        s.id === targetSceneId ? { ...s, imageUrl: sceneUrl } : s,
      );
      await prisma.adDraft.update({
        where: { id: adId },
        data: { scenes: updatedScenes, status: "PENDING" } as any,
      });
    } else {
      const ad = await prisma.ad.findUnique({
        where: { id: adId },
        select: { scenes: true },
      });
      updatedScenes = ((ad?.scenes as any[]) ?? []).map((s) =>
        s.id === targetSceneId ? { ...s, imageUrl: sceneUrl } : s,
      );
      await prisma.ad.update({
        where: { id: adId },
        data: { scenes: updatedScenes, status: "COMPLETED" } as any,
      });
    }

    adsService.emitAdUpdate(adId, {
      status: "PROCESSING",
      url: sceneUrl,
      taskType: "SINGLE_SCENE",
      sceneId: targetSceneId,
    });

    return { success: true, adId, url: sceneUrl };
  }
}
