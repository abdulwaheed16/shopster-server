import Logger from "../../../common/logging/logger";
import { prisma } from "../../../config/database.config";

import { adsService } from "../../../modules/ads/ads.service";
import { AI_PROVIDERS } from "../../../modules/ai/ai.constants";
import { aiService } from "../../../modules/ai/ai.service";
import { IStorageService } from "../../../modules/upload/interfaces/storage.interface";
import { BaseImageJobData } from "../types/job-data.types";
import { IAdProcessor, ProcessorResult } from "../types/processor.interface";

export class BaseImageProcessor implements IAdProcessor<BaseImageJobData> {
  constructor(private readonly storageService: IStorageService) {}

  async handle(data: BaseImageJobData): Promise<ProcessorResult> {
    const { adId, isDraft, mediaType } = data;

    Logger.info(`[BaseImageProcessor] Starting — adId=${adId}`);

    // Fetch full context from DB
    const draft = isDraft
      ? await prisma.adDraft.findUnique({ where: { id: adId } })
      : await prisma.ad.findUnique({ where: { id: adId } });

    if (!draft) {
      throw new Error(`[BaseImageProcessor] Draft/Ad not found: ${adId}`);
    }

    const productImages =
      data.productImages ||
      ((draft.products as any[]) || [])
        .map((p: any) => p.imageUrl)
        .filter(Boolean);

    const categoryName = (draft as any).categoryName || "General";
    const adType = (draft as any).adType || "UGC";
    const modelImage = draft.modelImageUrl;
    const templateImage =
      (draft as any).templateImage || (draft as any).templateImageUrl;
    const userPrompt = data.userPrompt || (draft as any).baseImagePrompt;

    Logger.info(`[BaseImageProcessor] Payload summary:`, {
      categoryName,
      adType,
      productImagesCount: productImages.length,
      hasModelImage: !!modelImage,
      hasTemplateImage: !!templateImage,
    });

    const payload = {
      adId,
      isDraft,
      taskType: "BASE_IMAGE" as const,
      mediaType,
      productImages,
      modelImage: modelImage ?? undefined,
      templateImage,
      categoryName: categoryName,
      adType,
      userPrompt,
    };

    const results = await aiService.generateImage(payload, AI_PROVIDERS.N8N);

    // Async path — n8n accepted, callback will update DB
    if (results.some((r: any) => r.metadata?.pending)) {
      Logger.info(
        `[BaseImageProcessor] Async — awaiting n8n callback for ${adId}`,
      );
      return { success: true, adId, async: true, taskType: "BASE_IMAGE" };
    }

    // Sync path (mock / direct return)
    const imageUrl =
      (results[0] as any).url ?? (results[0] as any).imageUrl ?? "";
    Logger.info(`[BaseImageProcessor] Sync result — imageUrl=${imageUrl}`);

    if (imageUrl && isDraft) {
      await prisma.adDraft.update({
        where: { id: adId },
        data: { baseImageUrl: imageUrl },
      });
    }

    adsService.emitAdUpdate(adId, {
      status: "COMPLETED",
      url: imageUrl,
      taskType: "BASE_IMAGE",
    });
    return { success: true, adId, url: imageUrl };
  }
}
