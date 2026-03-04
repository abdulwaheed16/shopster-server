import { Worker } from "bullmq";
import Logger from "../../../common/logging/logger";
import { connection, QUEUE_NAMES } from "../../../config/queue.config";
import { ModelImageJobData } from "../types/job-data.types";
import { createAdWorkerHandler } from "../utils/worker-handler";

export const modelImageWorker = new Worker<ModelImageJobData>(
  QUEUE_NAMES.MODEL_IMAGE,
  createAdWorkerHandler("MODEL_IMAGE"),
  {
    connection: connection as any,
    concurrency: 5,
    lockDuration: 5 * 60 * 1000,
    stalledInterval: 60 * 1000,
  },
);

modelImageWorker.on("completed", (job) =>
  Logger.info(`[ModelImageWorker] Job ${job.id} completed`),
);
modelImageWorker.on("failed", (job, err) =>
  Logger.error(`[ModelImageWorker] Job ${job?.id} failed: ${err.message}`),
);
modelImageWorker.on("error", (err) =>
  Logger.error(`[ModelImageWorker] Worker error: ${err.message}`),
);
