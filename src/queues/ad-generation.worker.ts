import axios from "axios";
import { Job, Worker } from "bullmq";
import { cloudinary, cloudinaryOptions } from "../config/cloudinary.config";
import { prisma } from "../config/database.config";
import { config } from "../config/env.config";
import { connection, QUEUE_NAMES } from "../config/queue.config";

// Ad Generation Job Data
export interface AdGenerationJobData {
  adId: string;
  userId: string;
  assembledPrompt: string;
  aspectRatio?: string;
  variantsCount?: number;
  productImage?: string;
}

// Create worker for ad generation
export const adGenerationWorker = new Worker(
  QUEUE_NAMES.AD_GENERATION,
  async (job: Job<AdGenerationJobData>) => {
    const { adId, assembledPrompt, aspectRatio, variantsCount, productImage } =
      job.data;

    console.log(`Processing ad generation job ${job.id} for ad ${adId}`);

    try {
      // Update ad status to PROCESSING
      await prisma.ad.update({
        where: { id: adId },
        data: { status: "PROCESSING" },
      });

      // Call n8n webhook
      const webhookUrl = config.webhook.n8nUrl;
      if (!webhookUrl) {
        throw new Error("N8N_WEBHOOK_URL is not configured");
      }

      const response = await axios.post(
        webhookUrl,
        {
          prompt: assembledPrompt,
          aspectRatio: aspectRatio || "1:1",
          variantsCount: variantsCount || 1,
          productImage,
        },
        {
          timeout: 30000, // 30 seconds timeout
        }
      );

      // Extract image URL from response
      // We expect n8n to return the image URL (could be temporary or external)
      const { imageUrl } = response.data;

      if (!imageUrl) {
        throw new Error("No image URL returned from generation service");
      }

      console.log(`Uploading generated image to Cloudinary: ${imageUrl}`);

      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(imageUrl, {
        ...cloudinaryOptions.ads,
        allowed_formats: [...cloudinaryOptions.ads.allowed_formats],
        public_id: `ad_${adId}_${Date.now()}`, // Unique ID
      });

      // Update ad with generated images and Cloudinary details
      await prisma.ad.update({
        where: { id: adId },
        data: {
          status: "COMPLETED",
          imageUrl: uploadResult.secure_url,
          imageUrls: [uploadResult.secure_url], // For now just one, or append if multiple
          cloudinaryId: uploadResult.public_id,
          storagePaths: [uploadResult.public_id],
          webhookJobId: response.data.jobId,
        },
      });

      console.log(`Ad generation completed for ad ${adId}`);
      return { success: true, adId };
    } catch (error: any) {
      console.error(`Ad generation failed for ad ${adId}:`, error.message);

      // Update ad status to FAILED
      await prisma.ad.update({
        where: { id: adId },
        data: {
          status: "FAILED",
          metadata: {
            error: error.message,
            failedAt: new Date().toISOString(),
          },
        },
      });

      throw error; // Re-throw to mark job as failed
    }
  },
  {
    connection,
    concurrency: 5, // Process up to 5 jobs concurrently
  }
);

// Worker event listeners
adGenerationWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

adGenerationWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

adGenerationWorker.on("error", (err) => {
  console.error("Worker error:", err);
});
