import { Worker } from "bullmq";
import Logger from "../../../common/logging/logger";
import { connection, QUEUE_NAMES } from "../../../config/queue.config";
import { AdTemplateJobData } from "../types/job-data.types";
import { createAdWorkerHandler } from "../utils/worker-handler";

export const adTemplateWorker = new Worker<AdTemplateJobData>(
  QUEUE_NAMES.AD_TEMPLATE,
  createAdWorkerHandler("AD_TEMPLATE"),
  {
    connection: connection as any,
    concurrency: 5,
    lockDuration: 5 * 60 * 1000,
    stalledInterval: 60 * 1000,
  },
);

adTemplateWorker.on("completed", (job) =>
  Logger.info(`[AdTemplateWorker] Job ${job.id} completed`),
);
adTemplateWorker.on("failed", (job, err) =>
  Logger.error(`[AdTemplateWorker] Job ${job?.id} failed: ${err.message}`),
);
adTemplateWorker.on("error", (err) =>
  Logger.error(`[AdTemplateWorker] Worker error: ${err.message}`),
);
