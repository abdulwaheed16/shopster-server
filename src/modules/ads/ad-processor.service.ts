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
    productImage?: string;
    templateImage?: string;
    templateAnalysis?: string;
    style?: StylePreset | string;
    color?: string;
    videoType?: string;
    mediaType: MediaType;
  }) {
    const {
      adId,
      assembledPrompt,
      aspectRatio,
      variantsCount,
      productImage,
      templateImage,
      templateAnalysis,
      style,
      color,
      videoType,
      mediaType,
    } = data;

    try {
      // 1. Status -> PROCESSING
      await prisma.ad.update({
        where: { id: adId },
        data: { status: AdStatus.PROCESSING },
      });

      let finalPrompt = assembledPrompt;
      let finalAspectRatio = aspectRatio;
      let modelId = IMAGE_MODELS.FAL_AI_FAST_SDXL;
      let imageUrls: string[] | undefined = undefined;

      // 2-3. (Optional) Vision-based Workflow
      if (templateImage) {
        console.log(
          `[AdProcessorService] Processing vision sequence for ad: ${adId}`,
        );

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

        // n8n flow: [Template, Product]
        imageUrls = [templateImage];
        if (productImage) imageUrls.push(productImage);

        console.log(
          `[AdProcessorService] Vision workflow complete. Prompt constructed.`,
        );
      }

      // 4. AI Generation
      // Switch between providers here. The user requested to use N8N.
      const provider = AI_PROVIDERS.N8N;
      console.log(
        `[AdProcessorService] Generating media via provider: ${provider}`,
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
                    videoType,
                    style,
                    color,
                    imageUrls,
                    modelId,
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
                numImages: variantsCount || 1,
                style,
                color,
                imageUrls,
                modelId,
              },
              provider,
            );

      // 3-4. Process each variant: Download -> Upload to our Storage
      console.log(
        `[AdProcessorService] Processing ${generationResults.length} variants for ad: ${adId}`,
      );

      const uploadResults = await Promise.all(
        generationResults?.map(async (res, index) => {
          try {
            // 3. Download to buffer
            const url = (res as any)?.url || (res as any)?.imageUrl;
            if (!url) throw new Error("No media URL found for variant");
            const buffer = await this.downloadImage(url);

            // 4. Upload to storage
            const isVideo = mediaType === MediaType.VIDEO;
            const uploadResult = await this.storageService.upload(buffer, {
              publicId: `ad_${adId}_v${index}_${Date.now()}`,
              folder: `ads/${adId}`,
              resourceType: isVideo ? "video" : "image",
            });

            return uploadResult;
          } catch (uploadError: any) {
            console.error(
              `[AdProcessorService] Variant ${index} failed:`,
              uploadError.message,
            );
            return null;
          }
        }),
      );

      // Filter out failed uploads
      const successfulUploads =
        uploadResults?.filter((res) => res !== null) ?? [];

      if (successfulUploads.length === 0) {
        throw new Error(MESSAGES.STORAGE.UPLOAD_FAILED);
      }

      const primaryAsset = successfulUploads[0];

      // 5. Update DB -> COMPLETED
      await prisma.ad.update({
        where: { id: adId },
        data: {
          status: AdStatus.COMPLETED,
          // Correctly assign to videoUrl or imageUrl based on content type
          ...(mediaType === MediaType.VIDEO
            ? {
                videoUrl: primaryAsset?.url,
                videoUrls: successfulUploads?.map((res) => res?.url) ?? [],
              }
            : {
                imageUrl: primaryAsset?.url,
                imageUrls: successfulUploads?.map((res) => res?.url) ?? [],
              }),
          cloudinaryId:
            this.storageService.getProviderName() ===
            STORAGE_PROVIDERS.CLOUDINARY
              ? primaryAsset?.id
              : undefined,
          storagePaths: successfulUploads?.map((res) => res?.id) ?? [],
        },
      });

      // 7. Post-generation Analysis (Vision)
      // Skip vision analysis for video ads as the current model/prompt is image-specific
      if (mediaType === MediaType.IMAGE) {
        console.log(`[AdProcessorService] Analyzing generated ad for: ${adId}`);
        try {
          const resultAnalysis = await aiService.analyzeGeneratedAd(
            primaryAsset?.url ?? "",
          );

          // 8. Final DB update with analysis
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
}
