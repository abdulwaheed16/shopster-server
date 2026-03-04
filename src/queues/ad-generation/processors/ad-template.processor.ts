import axios from "axios";
import Logger from "../../../common/logging/logger";
import { prisma } from "../../../config/database.config";
import { config } from "../../../config/env.config";
import { aiService } from "../../../modules/ai/ai.service";
import { IStorageService } from "../../../modules/upload/interfaces/storage.interface";
import { AdTemplateJobData } from "../types/job-data.types";
import { IAdProcessor, ProcessorResult } from "../types/processor.interface";

/**
 * Processor for "AD_TEMPLATE" (formerly Template Preview) tasks.
 *
 * Logic flow:
 * 1. Ensure reference analysis is cached in DB
 * 2. Hit n8n webhook for preview generation
 * 3. Upload response images to Vercel Blob (Optimized)
 * 4. Vision-analyze the generated previews
 * 5. Update Template record
 */
export class AdTemplateProcessor implements IAdProcessor<AdTemplateJobData> {
  private readonly logger = Logger;

  constructor(private readonly storageService: IStorageService) {}

  async handle(data: AdTemplateJobData): Promise<ProcessorResult> {
    const { templateId, promptTemplate, referenceAdImage, productImage } = data;

    this.logger.info(
      `[AdTemplateProcessor] Processing template preview for template ${templateId}`,
    );

    try {
      // 1. Analyze reference image if not already cached
      const template = await prisma.template.findUnique({
        where: { id: templateId },
        select: { referenceAdImage: true, referenceAnalysis: true },
      });

      if (template?.referenceAdImage && !template.referenceAnalysis) {
        this.logger.info(
          `[AdTemplateProcessor] Caching reference analysis for template: ${templateId}`,
        );
        try {
          const analysis = await aiService.analyzeAdTemplate(
            template.referenceAdImage,
          );
          await prisma.template.update({
            where: { id: templateId },
            data: { referenceAnalysis: analysis },
          });
        } catch (err: any) {
          this.logger.warn(
            `[AdTemplateProcessor] Failed to cache reference analysis: ${err.message}`,
          );
        }
      }

      // 2. n8n generation
      const webhookUrl = config.webhook.n8nUrl;
      if (!webhookUrl)
        throw new Error("n8n Webhook URL is not configured (N8N_WEBHOOK_URL)");

      const response = await axios.post(
        webhookUrl,
        {
          prompt: promptTemplate,
          referenceAdImage,
          productImage,
          isPreview: true,
          timestamp: new Date().toISOString(),
        },
        { timeout: 30000 },
      );

      const { previewImages } = response.data;
      if (!previewImages || !Array.isArray(previewImages)) {
        throw new Error("Invalid preview images returned from n8n");
      }

      // 3. Vercel Blob Upload
      this.logger.info(
        `[AdTemplateProcessor] Uploading ${previewImages.length} previews to Vercel Blob`,
      );
      const uploadPromises = previewImages.map(
        async (url: string, index: number) => {
          const result = await this.storageService.upload(url, {
            folder: "templates/previews",
            publicId: `tpl_preview_${templateId}_${Date.now()}_${index}`,
            resourceType: "image",
          });
          return result.url;
        },
      );

      const secureUrls = await Promise.all(uploadPromises);

      // 4. Update Database
      await prisma.template.update({
        where: { id: templateId },
        data: { previewImages: secureUrls },
      });

      // 5. Vision Analysis of previews
      this.logger.info(
        `[AdTemplateProcessor] Analyzing ${secureUrls.length} generated previews`,
      );
      try {
        const previewAnalyses = await Promise.all(
          secureUrls.map((url) => aiService.analyzeImage(url)),
        );
        await prisma.template.update({
          where: { id: templateId },
          data: { previewAnalyses },
        });
      } catch (analysisError: any) {
        this.logger.warn(
          `[AdTemplateProcessor] Preview analysis failed: ${analysisError.message}`,
        );
      }

      return { success: true, adId: templateId, url: secureUrls[0] };
    } catch (error: any) {
      this.logger.error(`[AdTemplateProcessor] FAILED: ${error.message}`);
      throw error;
    }
  }
}
