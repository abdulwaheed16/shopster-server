import { Job } from "bullmq";
import Logger from "../../../common/logging/logger";
import { prisma } from "../../../config/database.config";
import { adsService } from "../../../modules/ads/ads.service";
import { processorRegistry } from "../processors";
import { AdGenerationJobData } from "../types/job-data.types";
import { mapErrorMessage } from "./error-mapper";

/**
 * createAdWorkerHandler
 * ---------------------
 * A high-order function that wraps ad generation processors with
 * consistent error handling, status updates, and SSE notifications.
 */
export const createAdWorkerHandler = (defaultTaskType?: string) => {
  return async (job: Job<AdGenerationJobData>) => {
    const { adId, isDraft } = job.data;
    // Use job-provided taskType if available (e.g., STORYBOARD vs ALL_SCENES),
    // otherwise fallback to the defaultTaskType passed during initialization.
    const taskType = (job.data as any).taskType || defaultTaskType;

    try {
      Logger.info(`[Worker:${taskType}] Job ${job.id} started — adId=${adId}`);

      const processor = processorRegistry.get(taskType);
      if (!processor) {
        throw new Error(`Processor not found for taskType: ${taskType}`);
      }

      return await processor.handle(job.data as any);
    } catch (err: any) {
      const rawMessage = err.message || "Unknown error";
      Logger.error(`[Worker:${taskType}] Job ${job.id} failed: ${rawMessage}`);
      if (err.stack) Logger.error(err.stack);

      // Map technical errors to user-friendly messages using the utility
      const errorMessage = mapErrorMessage(err);

      // 1. Update DB status to FAILED so it persists
      try {
        const updateData: any = { status: "FAILED" };
        if (isDraft) {
          await prisma.adDraft.update({
            where: { id: adId },
            data: updateData,
          });
        } else {
          await prisma.ad.update({ where: { id: adId }, data: updateData });
        }
      } catch (dbErr) {
        Logger.error(
          `[Worker:${taskType}] Failed to update DB status to FAILED:`,
          dbErr,
        );
      }

      // 2. Emit SSE FAILED event so UI stops loading
      // We pass the friendly message to the UI, but keep the raw error in logs
      adsService.emitAdUpdate(adId, "FAILED" as any, {
        taskType,
        error: errorMessage,
        rawError: rawMessage, // Optional: backend logs often include this anyway
      });

      // 3. Re-throw so BullMQ handles retries/logging
      throw err;
    }
  };
};
