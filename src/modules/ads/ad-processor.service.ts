import { AdStatus, MediaType } from "@prisma/client";
import axios from "axios";
import { MESSAGES } from "../../common/constants/messages.constant";
import { prisma } from "../../config/database.config";
import {
  AI_PROVIDERS,
  AspectRatio,
  IMAGE_MODELS,
  StylePreset,
} from "../ai/ai.constants";
import { aiService } from "../ai/ai.service";
import { IStorageService } from "../upload/interfaces/storage.interface";
import { STORAGE_PROVIDERS } from "../upload/upload.constants";
import { adsService } from "./ads.service";

/**
 * Orchestrates: AI Generation -> Storage (Buffer) -> DB
 */
export class AdProcessorService {
  // Dependency Injection
  constructor(private readonly storageService: IStorageService) {}

  /**
   * Complete Execution Flow:
   * 1. Status -> PROCESSING
   * 2. (Optional) Vision Analysis of Template
   * 3. (Optional) Prompt Engineering
   * 4. AI Generation
   * 5. Download URLs to Buffers
   * 6. Upload Result via StorageService
   * 7. Post-generation Analysis (Vision)
   * 8. Update DB -> COMPLETED
   */

  async processGeneration(data: {
    adId: string;
    assembledPrompt: string;
    aspectRatio?: AspectRatio | string;
    variantsCount?: number;
    productImages?: string[];
    templateImage?: string;
    templateAnalysis?: string;
    style?: StylePreset | string;
    color?: string;
    scenes?: string[];
    mediaType: MediaType;
    duration?: number;
    templatePrompt?: string;
    modelImage?: string;
  }) {
    const {
      adId,
      assembledPrompt,
      aspectRatio,
      variantsCount,
      style,
      color,
      scenes,
      mediaType,
      duration,
      templatePrompt,
      modelImage,
    } = data;

    // Use actual data or fallback to mock data for testing n8n flow
    const productImages = data.productImages || [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1080&h=1080&fit=crop&q=80",
    ];
    const templateImage =
      data.templateImage ||
      "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=1080&h=1080&fit=crop&q=80";
    const templateAnalysis = data.templateAnalysis;

    try {
      // 1. Status -> PROCESSING
      await prisma.ad.update({
        where: { id: adId },
        data: { status: AdStatus.PROCESSING },
      });

      adsService.emitAdUpdate(adId, AdStatus.PROCESSING);

      let finalPrompt = assembledPrompt;
      let finalAspectRatio = aspectRatio;
      let modelId = IMAGE_MODELS.FAL_AI_FAST_SDXL;

      // 2-3. (Optional) Vision-based Workflow
      if (templateImage) {
        console.log(
          `[AdProcessorService] Processing vision sequence for ad: ${adId}`,
        );

        try {
          let visionAnalysis = templateAnalysis;

          // 2. Vision Analysis of Template (Skip if cached)
          if (!visionAnalysis) {
            console.log(
              `[AdProcessorService] Cache miss - analyzing template: ${adId}`,
            );
            visionAnalysis = await aiService.analyzeAdTemplate(templateImage);
          } else {
            console.log(
              `[AdProcessorService] Cache hit - using stored analysis for: ${adId}`,
            );
          }

          // 3. Prompt Construction
          const { imagePrompt, aspectRatio: inferredRatio } =
            await aiService.constructAdPrompt(assembledPrompt, visionAnalysis);

          finalPrompt = imagePrompt;
          finalAspectRatio = inferredRatio;
          modelId = IMAGE_MODELS.FAL_AI_NANO_BANANA_PRO_EDIT;

          console.log(
            `[AdProcessorService] Vision workflow complete. Prompt constructed.`,
          );
        } catch (visionError: any) {
          console.warn(
            `[AdProcessorService] Vision/Prompt construction failed (Gemini Quota?):`,
            visionError.message,
          );
          console.log(`[AdProcessorService] Falling back to assembled prompt.`);
          // Status quo remains: finalPrompt = assembledPrompt, etc.
        }
      }

      // 4. AI Generation
      // Switch between providers here. The user requested to use N8N.
      const provider = AI_PROVIDERS.N8N;
      console.log(
        `[AdProcessorService] Generating media via provider----------------: ${provider}`,
      );

      const generationResults =
        mediaType === MediaType.VIDEO
          ? [
              await aiService
                .generateVideo(
                  {
                    adId,
                    prompt: finalPrompt,
                    aspectRatio: finalAspectRatio as string,
                    scenes,
                    style,
                    color,
                    modelId,
                    duration,
                    productImages,
                    templateImage,
                    templatePrompt,
                    modelImage,
                  } as any,
                  provider,
                )
                .then((res) => ({
                  url: res?.videoUrl,
                  metadata: res?.metadata,
                })),
            ]
          : await aiService.generateImage(
              {
                adId,
                prompt: finalPrompt,
                aspectRatio: finalAspectRatio,
                variants: variantsCount || 1,
                style,
                color,
                modelId,
                productImages,
                templateImage,
                templatePrompt,
                userPrompt: scenes?.[0] ?? "",
                modelImage,
              },
              provider,
            );

      // 3. Extract URLs directly from n8n response (no need to download/upload)
      // NOTE: If you need to re-upload to your own storage in the future, uncomment below:
      // import { downloadAndUploadMedia } from './utils/media-upload.util';
      // const uploadResults = await downloadAndUploadMedia(
      //   generationResults.map(r => r.imageUrl),
      //   adId,
      //   mediaType,
      //   this.storageService
      // );

      console.log("generationResults", generationResults);

      console.log(
        `[AdProcessorService] Processing ${generationResults.length} variants for ad: ${adId}`,
      );

      // Extract n8n URLs from the response
      const n8nUrls = generationResults
        ?.map((res, index) => {
          const url = (res as any)?.imageUrl || (res as any)?.url;
          if (!url) {
            console.error(
              `[AdProcessorService] No URL found for variant ${index}`,
            );
            return null;
          }
          return url;
        })
        .filter(Boolean) as string[];

      if (n8nUrls.length === 0) {
        throw new Error("No valid image URLs returned from n8n");
      }

      console.log(`[AdProcessorService] Extracted URLs:`, n8nUrls);

      // 4. Update DB -> COMPLETED immediately with n8n URLs (show to UI instantly)
      await prisma.ad.update({
        where: { id: adId },
        data: {
          status: AdStatus.COMPLETED,
          ...(mediaType === MediaType.VIDEO
            ? {
                videoUrl: n8nUrls[0],
                videoUrls: n8nUrls,
              }
            : {
                imageUrl: n8nUrls[0],
                imageUrls: n8nUrls,
              }),
        },
      });

      // Emit update to UI immediately
      adsService.emitAdUpdate(adId, AdStatus.COMPLETED, {
        url: n8nUrls[0],
        mediaType,
        // Include variants for the frontend
        ...(mediaType === MediaType.VIDEO
          ? { videoUrls: n8nUrls }
          : { imageUrls: n8nUrls }),
      });

      console.log(
        `[AdProcessorService] Ad ${adId} completed and visible to user`,
      );

      // 5. Background: Download and upload to our storage (non-blocking)
      // This happens in the background and won't block the user experience
      this.uploadToStorageInBackground(adId, n8nUrls, mediaType).catch(
        (error: any) => {
          console.warn(
            `[AdProcessorService] Background upload failed for ${adId}:`,
            error.message,
          );
          // Don't throw - user already sees the ad with n8n URLs
        },
      );

      // 6. Post-generation Analysis (Vision) - DISABLED (using mock providers)
      // Uncomment this when you want to use Gemini for vision analysis
      /*
      if (mediaType === MediaType.IMAGE) {
        console.log(`[AdProcessorService] Analyzing generated ad for: ${adId}`);
        try {
          const resultAnalysis = await aiService.analyzeGeneratedAd(
            n8nUrls[0] ?? "",
          );

          // Final DB update with analysis
          await prisma.ad.update({
            where: { id: adId },
            data: { resultAnalysis } as any,
          });
          console.log(`[AdProcessorService] Analysis complete for: ${adId}`);
        } catch (analysisError: any) {
          console.warn(
            `[AdProcessorService] Analysis failed (non-critical):`,
            analysisError.message,
          );
          // We don't fail the whole process if analysis fails
        }
      } else {
        console.log(
          `[AdProcessorService] Skipping vision analysis for mediaType: ${mediaType} (Ad: ${adId})`,
        );
      }
      */

      return { success: true, adId };
    } catch (error: any) {
      console.error(
        `[AdProcessorService] ${MESSAGES.ADS.GENERATION_FAILED} for ${adId}:`,
        error.message,
      );

      await prisma.ad.update({
        where: { id: adId },
        data: {
          status: AdStatus.FAILED,
          metadata: {
            error: error.message,
            failedAt: new Date().toISOString(),
          },
        },
      });

      adsService.emitAdUpdate(adId, AdStatus.FAILED, { error: error.message });

      throw error;
    }
  }

  /**
   * Helper: Download generated image to buffer.
   */
  private async downloadImage(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      return Buffer.from(response.data);
    } catch (error: any) {
      console.error(
        `[AdProcessorService] Failed to download image from ${url}:`,
        error.message,
      );
      throw new Error(`Failed to download image: ${error.message}`);
    }
  }

  /**
   * Background: Download n8n URLs and upload to our storage
   * This runs asynchronously and won't block the user experience
   * Includes retry logic for failed uploads
   */
  private async uploadToStorageInBackground(
    adId: string,
    n8nUrls: string[],
    mediaType: MediaType,
  ): Promise<void> {
    console.log(`[AdProcessorService] Starting background upload for ${adId}`);

    const maxRetries = 1; // Retry once if it fails
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        // Download and upload each variant
        const uploadResults = await Promise.all(
          n8nUrls.map(async (url, index) => {
            try {
              // Download to buffer
              const buffer = await this.downloadImage(url);

              // Upload to storage
              const isVideo = mediaType === MediaType.VIDEO;
              const uploadResult = await this.storageService.upload(buffer, {
                publicId: `ad_${adId}_v${index}_${Date.now()}`,
                folder: `ads/${adId}`,
                resourceType: isVideo ? "video" : "image",
              });

              return uploadResult;
            } catch (error: any) {
              console.error(
                `[AdProcessorService] Background upload variant ${index} failed:`,
                error.message,
              );
              return null;
            }
          }),
        );

        // Filter successful uploads
        const successfulUploads = uploadResults.filter((res) => res !== null);

        if (successfulUploads.length > 0) {
          // Update DB with our storage URLs (silently, don't emit events)
          await prisma.ad.update({
            where: { id: adId },
            data: {
              ...(mediaType === MediaType.VIDEO
                ? {
                    videoUrl: successfulUploads[0]?.url,
                    videoUrls: successfulUploads?.map((res) => res?.url) ?? [],
                  }
                : {
                    imageUrl: successfulUploads[0]?.url,
                    imageUrls: successfulUploads?.map((res) => res?.url) ?? [],
                  }),
              cloudinaryId:
                this.storageService.getProviderName() ===
                STORAGE_PROVIDERS.VERCEL_BLOB
                  ? successfulUploads[0]?.id
                  : undefined,
              storagePaths: successfulUploads?.map((res) => res?.id) ?? [],
            },
          });

          console.log(
            `[AdProcessorService] Background upload completed for ${adId}`,
          );
          return; // Success!
        }

        throw new Error("All variants failed to upload");
      } catch (error: any) {
        attempt++;
        if (attempt > maxRetries) {
          console.error(
            `[AdProcessorService] Background upload failed after ${maxRetries} retries for ${adId}:`,
            error.message,
          );
          // Don't throw - user already has the ad with n8n URLs
          return;
        }
        console.warn(
          `[AdProcessorService] Background upload attempt ${attempt} failed, retrying...`,
        );
        // Wait 2 seconds before retry
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }
}
