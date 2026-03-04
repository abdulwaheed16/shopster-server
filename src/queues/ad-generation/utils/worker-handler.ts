import { AdStatus } from "@prisma/client";
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
    const { adId, taskType: dataTaskType } = job.data;
    const taskType = dataTaskType || defaultTaskType;

    if (!taskType) {
      throw new Error(`[Worker] No taskType provided for job ${job.id}`);
    }

    try {
      Logger.info(`[Worker:${taskType}] Job ${job.id} started — adId=${adId}`);

      const processor = processorRegistry.get(taskType);
      if (!processor) {
        throw new Error(`Processor not found for taskType: ${taskType}`);
      }

      // Root status becomes PROCESSING upon pickup
      adsService.emitAdUpdate(adId, {
        status: "PROCESSING",
        taskType,
      });

      return await processor.handle(job.data as AdGenerationJobData);
    } catch (err: any) {
      const rawMessage = err.message || "Unknown error";
      Logger.error(`[Worker:${taskType}] Job ${job.id} failed: ${rawMessage}`);
      if (err.stack) Logger.error(err.stack);

      // Map technical errors to user-friendly messages using the utility
      const errorMessage = mapErrorMessage(err);

      // 1. Update DB status to FAILED so it persists
      try {
        const { mediaType } = job.data;
        const updateData: any =
          mediaType === "VIDEO"
            ? { currentTask: { type: taskType, status: "FAILED" } }
            : { status: "FAILED" as AdStatus, error: errorMessage };

        const draft = await prisma.adDraft.findUnique({ where: { id: adId } });
        if (draft) {
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
      adsService.emitAdUpdate(adId, {
        status: "FAILED",
        taskType,
        error: errorMessage,
        rawError: rawMessage,
      });

      // 3. Re-throw so BullMQ handles retries/logging
      throw err;
    }
  };
};
