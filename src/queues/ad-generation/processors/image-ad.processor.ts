import { AdStatus, MediaType, UsageType } from "@prisma/client";
import Logger from "../../../common/logging/logger";
import { prisma } from "../../../config/database.config";
import { adsService } from "../../../modules/ads/ads.service";
import { AD_COSTS } from "../../../modules/ads/constants/ad-costs";
import { AI_PROVIDERS } from "../../../modules/ai/ai.constants";
import { aiService } from "../../../modules/ai/ai.service";
import { billingService } from "../../../modules/billing/billing.service";
import { IStorageService } from "../../../modules/upload/interfaces/storage.interface";
import { ImageAdJobData } from "../types/job-data.types";
import { IAdProcessor, ProcessorResult } from "../types/processor.interface";

/**
 * ImageAdProcessor — Strategy for IMAGE_AD task
 *
 * Sends to n8n: adId, baseImage?, productImages?, aspectRatio, userPrompt,
 *               callbackUrl (injected by N8NBaseProvider), timestamp
 */
export class ImageAdProcessor implements IAdProcessor<ImageAdJobData> {
  constructor(private readonly storageService: IStorageService) {}

  async handle(data: ImageAdJobData): Promise<ProcessorResult> {
    const { adId, userId, mediaType } = data;

    Logger.info(
      `[ImageAdProcessor] Starting — adId=${adId} mediaType=${mediaType}`,
    );

    const ad = await prisma.ad.findUnique({ where: { id: adId } });

    if (!ad) {
      throw new Error(`[ImageAdProcessor] Ad not found: ${adId}`);
    }

    const payload = {
      ...data,
      taskType: "IMAGE_AD",
      categoryName: (data as any).categoryName || ad.categoryName || "",
      adType: (data as any).adType || ad.adType || "",
      productDescription:
        (data as any).productDescription || ad.productDescription || "",
      baseImage: (data as any).baseImage || ad.baseImageUrl || "",
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
        taskType: "IMAGE_AD",
      });
      Logger.info(
        `[ImageAdProcessor] Async — awaiting n8n callback for ${adId}`,
      );
      return { success: true, adId, async: true, taskType: "IMAGE_AD" };
    }

    // Sync path
    const finalUrl = generationResults?.url ?? "";
    const allUrls = generationResults?.url ? [generationResults.url] : [];

    Logger.info(`[ImageAdProcessor] Sync result — url=${finalUrl}`);

    await prisma.ad.update({
      where: { id: adId },
      data: {
        status: AdStatus.COMPLETED,
        imageUrl: finalUrl,
        imageUrls: allUrls,
      },
    });

    adsService.emitAdUpdate(adId, {
      status: "COMPLETED",
      url: finalUrl,
      mediaType: MediaType.IMAGE,
      adId: adId,
      imageUrl: finalUrl,
      imageUrls: allUrls,
      taskType: "IMAGE_AD",
    });

    await this.deductCredits(userId, adId, MediaType.IMAGE);

    Logger.info(`[ImageAdProcessor] Process completed — adId=${adId}`);
    return { success: true, adId, url: finalUrl };
  }

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
          `[ImageAdProcessor] Credit deduction failed: ${err.message}`,
        ),
      );
  }
}
