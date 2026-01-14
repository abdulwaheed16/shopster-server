import { AdStatus } from "@prisma/client";
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
    templateImage?: string; // Reference image for style/layout
    templateAnalysis?: string; // Cached vision analysis of the template
    style?: StylePreset | string;
    color?: string;
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
          `[AdProcessorService] Processing vision sequence for ad: ${adId}`
        );

        let visionAnalysis = templateAnalysis;

        // 2. Vision Analysis of Template (Skip if cached)
        if (!visionAnalysis) {
          console.log(
            `[AdProcessorService] Cache miss - analyzing template: ${adId}`
          );
          visionAnalysis = await aiService.analyzeAdTemplate(templateImage);
        } else {
          console.log(
            `[AdProcessorService] Cache hit - using stored analysis for: ${adId}`
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
          `[AdProcessorService] Vision workflow complete. Prompt constructed.`
        );
      }

      // 4. AI Generation
      const generationResults = await aiService.generateImage(
        {
          prompt: finalPrompt,
          aspectRatio: finalAspectRatio,
          numImages: variantsCount || 1,
          style,
          color,
          imageUrls,
          modelId,
        },
        AI_PROVIDERS.FAL_AI
      );

      // 3-4. Process each variant: Download -> Upload to our Storage
      console.log(
        `[AdProcessorService] Processing ${generationResults.length} variants for ad: ${adId}`
      );

      const uploadResults = await Promise.all(
        generationResults.map(async (res, index) => {
          try {
            // 3. Download to buffer
            const buffer = await this.downloadImage(res.imageUrl);

            // 4. Upload to storage
            const uploadResult = await this.storageService.upload(buffer, {
              publicId: `ad_${adId}_v${index}_${Date.now()}`,
              folder: `ads/${adId}`,
            });

            return uploadResult;
          } catch (uploadError: any) {
            console.error(
              `[AdProcessorService] Variant ${index} failed:`,
              uploadError.message
            );
            return null;
          }
        })
      );

      // Filter out failed uploads
      const successfulUploads = uploadResults.filter((res) => res !== null);

      if (successfulUploads.length === 0) {
        throw new Error(MESSAGES.STORAGE.UPLOAD_FAILED);
      }

      const primaryImage = successfulUploads[0];

      // 5. Update DB -> COMPLETED
      await prisma.ad.update({
        where: { id: adId },
        data: {
          status: AdStatus.COMPLETED,
          imageUrl: primaryImage.url,
          imageUrls: successfulUploads.map((res) => res.url),
          cloudinaryId:
            this.storageService.getProviderName() ===
            STORAGE_PROVIDERS.CLOUDINARY
              ? primaryImage.id
              : undefined,
          storagePaths: successfulUploads.map((res) => res.id),
        },
      });

      // 7. Post-generation Analysis (Vision)
      // Only analyze the primary variant for optimization
      console.log(`[AdProcessorService] Analyzing generated ad for: ${adId}`);
      try {
        const resultAnalysis = await aiService.analyzeGeneratedAd(
          primaryImage.url
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
          analysisError.message
        );
        // We don't fail the whole process if analysis fails
      }

      return { success: true, adId };
    } catch (error: any) {
      console.error(
        `[AdProcessorService] ${MESSAGES.ADS.GENERATION_FAILED} for ${adId}:`,
        error.message
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
        error.message
      );
      throw new Error(`Failed to download image: ${error.message}`);
    }
  }
}
