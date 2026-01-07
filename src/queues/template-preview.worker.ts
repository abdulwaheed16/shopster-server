import axios from "axios";
import { Job, Worker } from "bullmq";
import { cloudinary, cloudinaryOptions } from "../config/cloudinary.config";
import { prisma } from "../config/database.config";
import { config } from "../config/env.config";
import { connection, QUEUE_NAMES } from "../config/queue.config";

// Template Preview Job Data
export interface TemplatePreviewJobData {
  templateId: string;
  userId: string;
  promptTemplate: string;
  referenceAdImage?: string;
  productImage?: string;
}

// Create worker for template preview generation
export const templatePreviewWorker = new Worker(
  QUEUE_NAMES.TEMPLATE_PREVIEW,
  async (job: Job<TemplatePreviewJobData>) => {
    const { templateId, promptTemplate, referenceAdImage, productImage } =
      job.data;

    console.log(
      `Processing template preview job ${job.id} for template ${templateId}`
    );

    try {
      // Call n8n webhook for preview generation
      const webhookUrl = config.webhook.n8nUrl;
      if (!webhookUrl) {
        throw new Error("N8N_WEBHOOK_URL is not configured");
      }

      const response = await axios.post(
        webhookUrl,
        {
          prompt: promptTemplate,
          referenceAdImage,
          productImage,
          isPreview: true,
        },
        {
          timeout: 30000, // 30 seconds timeout
        }
      );

      // Extract preview URLs from response
      const { previewImages } = response.data;

      if (!previewImages || !Array.isArray(previewImages)) {
        throw new Error(
          "Invalid preview images returned from generation service"
        );
      }

      console.log(
        `Uploading ${previewImages.length} preview images to Cloudinary...`
      );

      // Upload all previews to Cloudinary
      const uploadPromises = previewImages.map(
        async (url: string, index: number) => {
          const result = await cloudinary.uploader.upload(url, {
            ...cloudinaryOptions.templates,
            allowed_formats: [...cloudinaryOptions.templates.allowed_formats],
            public_id: `tpl_preview_${templateId}_${Date.now()}_${index}`,
          });
          return result.secure_url;
        }
      );

      const secureUrls = await Promise.all(uploadPromises);

      // Update template with preview images
      await prisma.template.update({
        where: { id: templateId },
        data: {
          previewImages: secureUrls,
        },
      });

      console.log(`Template preview completed for template ${templateId}`);
      return { success: true, templateId };
    } catch (error: any) {
      console.error(
        `Template preview failed for template ${templateId}:`,
        error.message
      );
      throw error; // Re-throw to mark job as failed
    }
  },
  {
    connection,
    concurrency: 3, // Process up to 3 preview jobs concurrently
  }
);

// Worker event listeners
templatePreviewWorker.on("completed", (job) => {
  console.log(`Preview job ${job.id} completed successfully`);
});

templatePreviewWorker.on("failed", (job, err) => {
  console.error(`Preview job ${job?.id} failed:`, err.message);
});

templatePreviewWorker.on("error", (err) => {
  console.error("Preview worker error:", err);
});
