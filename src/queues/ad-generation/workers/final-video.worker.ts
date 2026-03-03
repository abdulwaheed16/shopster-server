import { Worker } from "bullmq";
import { connection, QUEUE_NAMES } from "../../../config/queue.config";
import { FinalVideoJobData } from "../types/job-data.types";
import { createAdWorkerHandler } from "../utils/worker-handler";
import Logger from "../../../common/logging/logger";

export const finalVideoWorker = new Worker<FinalVideoJobData>(
  QUEUE_NAMES.FINAL_VIDEO,
  createAdWorkerHandler("FINAL_VIDEO"),
  {
    connection: connection as any,
    concurrency: 2,
    lockDuration: 15 * 60 * 1000,
    stalledInterval: 60 * 1000,
  },
);

finalVideoWorker.on("completed", (job) =>
  Logger.info(`[FinalVideoWorker] Job ${job.id} completed`),
);
finalVideoWorker.on("failed", (job, err) =>
  Logger.error(`[FinalVideoWorker] Job ${job?.id} failed: ${err.message}`),
);
finalVideoWorker.on("error", (err) =>
  Logger.error(`[FinalVideoWorker] Worker error: ${err.message}`),
);
