import Logger from "../../../common/logging/logger";
import { prisma } from "../../../config/database.config";

import { adsService } from "../../../modules/ads/ads.service";
import { AI_PROVIDERS } from "../../../modules/ai/ai.constants";
import { aiService } from "../../../modules/ai/ai.service";
import { IStorageService } from "../../../modules/upload/interfaces/storage.interface";
import { StoryboardJobData } from "../types/job-data.types";
import { IAdProcessor, ProcessorResult } from "../types/processor.interface";

/**
 * StoryboardProcessor — Strategy for STORYBOARD and ALL_SCENES tasks
 *
 * Sends: adId, baseImage, templateId?, productImages?,
 *        callbackUrl (injected by N8NBaseProvider), timestamp
 *
 * On success: updates AdDraft.scenes and emits SSE STORYBOARD_READY.
 */
export class StoryboardProcessor implements IAdProcessor<StoryboardJobData> {
  constructor(private readonly storageService: IStorageService) {}

  async handle(data: StoryboardJobData): Promise<ProcessorResult> {
    const { adId, isDraft, taskType, baseImage, storyboard, mediaType } = data;

    Logger.info(
      `[StoryboardProcessor] Starting — adId=${adId} taskType=${taskType}`,
    );

    // Fetch full context from DB
    const draft = isDraft
      ? await prisma.adDraft.findUnique({ where: { id: adId } })
      : await prisma.ad.findUnique({ where: { id: adId } });

    if (!draft) {
      throw new Error(`[StoryboardProcessor] Draft/Ad not found: ${adId}`);
    }

    const productImages =
      data.productImages ||
      ((draft.products as any[] | undefined) || [])
        .map((p: any) => p.imageUrl)
        .filter(Boolean);

    const userPrompt =
      data.userPrompt ||
      (draft as any).scenePrompt ||
      (draft as any).baseImagePrompt ||
      (draft as any).productDescription ||
      "";
    // Construct an explicit, type-safe payload for the AI service
    const payload = {
      adId,
      taskType: taskType as any,
      mediaType: "IMAGE" as const,
      userPrompt, // Standardized name
      prompt: userPrompt, // Legacy fallback
      productDescription:
        (data as any).productDescription ||
        (draft as any).productDescription ||
        "",
      productImages,
      baseImage: baseImage,
      storyboard: storyboard || (draft as any).storyboard,
      category:
        (data as any).categoryName || (draft as any).categoryName || "General",
      adType: (data as any).adType || (draft as any).adType || "UGC",
    };

    const result = await aiService.generateImage(payload, AI_PROVIDERS.N8N);

    // Async path
    if ((result as any)?.metadata?.pending) {
      Logger.info(
        `[StoryboardProcessor] Async — awaiting n8n callback for ${adId}`,
      );
      adsService.emitAdUpdate(adId, {
        status: "PROCESSING",
      });
      return { success: true, adId, async: true, taskType };
    }

    // Sync path
    const scenes = (result as any).scenes ?? [];
    Logger.info(`[StoryboardProcessor] Sync result — ${scenes.length} scenes`);

    if (isDraft) {
      await prisma.adDraft.update({
        where: { id: adId },
        data: { scenes, status: "PENDING", currentStep: 4 } as any,
      });
    } else {
      await prisma.ad.update({
        where: { id: adId },
        data: { scenes, status: "COMPLETED" } as any,
      });
    }

    adsService.emitAdUpdate(adId, {
      status: "PROCESSING",
      scenes,
      taskType: "STORYBOARD",
    });
    return { success: true, adId, scenes };
  }
}
