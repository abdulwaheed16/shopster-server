import { Worker } from "bullmq";
import Logger from "../../../common/logging/logger";
import { connection, QUEUE_NAMES } from "../../../config/queue.config";
import { ImageAdJobData } from "../types/job-data.types";
import { createAdWorkerHandler } from "../utils/worker-handler";

export const imageAdWorker = new Worker<ImageAdJobData>(
  QUEUE_NAMES.IMAGE_AD,
  createAdWorkerHandler("IMAGE_AD"),
  {
    connection: connection as any,
    concurrency: 5, // Higher concurrency for images
    lockDuration: 15 * 60 * 1000,
    stalledInterval: 60 * 1000,
  },
);

imageAdWorker.on("completed", (job) =>
  Logger.info(`[ImageAdWorker] Job ${job.id} completed`),
);
imageAdWorker.on("failed", (job, err) =>
  Logger.error(`[ImageAdWorker] Job ${job?.id} failed: ${err.message}`),
);
imageAdWorker.on("error", (err) =>
  Logger.error(`[ImageAdWorker] Worker error: ${err.message}`),
);
