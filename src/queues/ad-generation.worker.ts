import { MediaType } from "@prisma/client";
import { Job, Worker } from "bullmq";
import { connection, QUEUE_NAMES } from "../config/queue.config";
import { AdProcessorService } from "../modules/ads/ad-processor.service";
import { vercelBlobService } from "../modules/upload/services/storage/vercel-blob.service";

import { AspectRatio, StylePreset } from "../modules/ai/ai.constants";

// Ad Generation Job Data
export interface AdGenerationJobData {
  adId: string;
  userId: string;
  assembledPrompt: string;
  aspectRatio?: AspectRatio | string;
  variantsCount?: number;
  productImages?: string[];
  templateImage?: string; // Reference image FOR style/layout
  templateAnalysis?: string; // Cached vision analysis (Optimization)
  style?: StylePreset | string;
  color?: string;
  scenes?: string[];
  mediaType: MediaType;
  duration?: number;
  templatePrompt?: string;
  modelImage?: string;
}

// Instantiate the processor with Vercel Blob (keeping Cloudinary available via DI if needed)
const adProcessorService = new AdProcessorService(vercelBlobService);

/**
 * Worker to process ad generation jobs.
 * This worker demonstrates the Facade pattern by delegating complex orchestration
 * to the AdProcessorService.
 */
export const adGenerationWorker = new Worker<AdGenerationJobData>(
  QUEUE_NAMES.AD_GENERATION,
  async (job: Job<AdGenerationJobData>) => {
    console.log(
      `[Worker] Started processing job ${job.id} for ad ${job.data.adId}`,
    );

    try {
      // Delegate to the orchestrator service
      const result = await adProcessorService.processGeneration({
        adId: job?.data?.adId,
        assembledPrompt: job?.data?.assembledPrompt,
        aspectRatio: job?.data?.aspectRatio,
        variantsCount: job?.data?.variantsCount,
        productImages: job?.data?.productImages,
        templateImage: job?.data?.templateImage,
        style: job?.data?.style,
        color: job?.data?.color,
        scenes: job?.data?.scenes,
        mediaType: job?.data?.mediaType,
        duration: job?.data?.duration,
        templatePrompt: job?.data?.templatePrompt,
        modelImage: job?.data?.modelImage,
      });

      console.log("Ad Generation Worker Result: ", result);

      return result;
    } catch (error: any) {
      console.error(`[Worker] Job ${job.id} failed:`, error.message);
      throw error;
    }
  },
  {
    connection,
    concurrency: 5, // Process up to 5 jobs concurrently
    // IMPORTANT: n8n calls can take several minutes for AI generation.
    // BullMQ's default lockDuration is 30s — jobs taking longer get marked
    // as "stalled" and retried, causing duplicate n8n calls and 524 errors.
    // Set to 15 minutes to safely cover the 10-minute axios timeout.
    // lockDuration: 15 * 60 * 1000, // 15 minutes
    // stalledInterval: 60 * 1000, // Check for stalled jobs every 60s (not 30s default)
  },
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
