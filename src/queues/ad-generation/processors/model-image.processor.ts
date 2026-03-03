import Logger from "../../../common/logging/logger";
import { prisma } from "../../../config/database.config";

import { adsService } from "../../../modules/ads/ads.service";
import { AI_PROVIDERS } from "../../../modules/ai/ai.constants";
import { aiService } from "../../../modules/ai/ai.service";
import { IStorageService } from "../../../modules/upload/interfaces/storage.interface";
import { ModelImageJobData } from "../types/job-data.types";
import { IAdProcessor, ProcessorResult } from "../types/processor.interface";

/**
 * ModelImageProcessor — Strategy for MODEL_IMAGE task
 *
 * Sends: adId, gender, age, skinColor, userPrompt?,
 *        callbackUrl (injected by N8NBaseProvider), timestamp
 *
 * On success: updates AdDraft.modelImageUrl and emits SSE MODEL_READY.
 */
export class ModelImageProcessor implements IAdProcessor<ModelImageJobData> {
  constructor(private readonly storageService: IStorageService) {}

  async handle(data: ModelImageJobData): Promise<ProcessorResult> {
    const { adId, isDraft, gender, age, skinColor, userPrompt, mediaType } =
      data;

    Logger.info(`[ModelImageProcessor] Starting — adId=${adId}`);
    Logger.info(`[ModelImageProcessor] Model description:`, {
      gender,
      age,
      skinColor,
      hasUserPrompt: !!userPrompt,
    });

    const payload = {
      adId,
      taskType: "MODEL_IMAGE" as const,
      mediaType,
      modelDescription: { gender, age, skin: skinColor, notes: userPrompt },
      prompt: `Portrait of a ${gender}, age ${age}, with ${skinColor} skin tone. ${userPrompt ?? ""}`.trim(),
    };

    const results = await aiService.generateImage(payload, AI_PROVIDERS.N8N);

    // Async path
    if (results.some((r: any) => r.metadata?.pending)) {
      Logger.info(
        `[ModelImageProcessor] Async — awaiting n8n callback for ${adId}`,
      );
      adsService.emitAdUpdate(adId, "PROCESSING" as any, {
        taskType: "MODEL_IMAGE",
      });
      return { success: true, adId, async: true, taskType: "MODEL_IMAGE" };
    }

    // Sync path
    const imageUrl =
      (results[0] as any).url ?? (results[0] as any).imageUrl ?? "";
    Logger.info(`[ModelImageProcessor] Sync result — imageUrl=${imageUrl}`);

    if (isDraft) {
      await prisma.adDraft.update({
        where: { id: adId },
        data: { modelImageUrl: imageUrl },
      });
    } else {
      await prisma.ad.update({
        where: { id: adId },
        data: { imageUrl, status: "COMPLETED" },
      });
    }

    adsService.emitAdUpdate(adId, "MODEL_READY" as any, {
      url: imageUrl,
      taskType: "MODEL_IMAGE",
    });
    return { success: true, adId, url: imageUrl };
  }
}
