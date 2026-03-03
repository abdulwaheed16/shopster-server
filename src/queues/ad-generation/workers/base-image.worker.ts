import { Worker } from "bullmq";
import Logger from "../../../common/logging/logger";
import { connection, QUEUE_NAMES } from "../../../config/queue.config";
import { BaseImageJobData } from "../types/job-data.types";
import { createAdWorkerHandler } from "../utils/worker-handler";

export const baseImageWorker = new Worker<BaseImageJobData>(
  QUEUE_NAMES.BASE_IMAGE,
  createAdWorkerHandler("BASE_IMAGE"),
  {
    connection: connection as any,
    concurrency: 10,
    lockDuration: 3 * 60 * 1000,
    stalledInterval: 60 * 1000,
  },
);

baseImageWorker.on("completed", (job) =>
  Logger.info(`[BaseImageWorker] Job ${job.id} completed`),
);
baseImageWorker.on("failed", (job, err) =>
  Logger.error(`[BaseImageWorker] Job ${job?.id} failed: ${err.message}`),
);
baseImageWorker.on("error", (err) =>
  Logger.error(`[BaseImageWorker] Worker error: ${err.message}`),
);
