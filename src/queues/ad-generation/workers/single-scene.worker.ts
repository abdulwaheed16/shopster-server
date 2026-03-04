import { Worker } from "bullmq";
import Logger from "../../../common/logging/logger";
import { connection, QUEUE_NAMES } from "../../../config/queue.config";
import { SingleSceneJobData } from "../types/job-data.types";
import { createAdWorkerHandler } from "../utils/worker-handler";

export const singleSceneWorker = new Worker<SingleSceneJobData>(
  QUEUE_NAMES.SINGLE_SCENE,
  createAdWorkerHandler("SINGLE_SCENE"),
  {
    connection: connection as any,
    concurrency: 5,
    lockDuration: 5 * 60 * 1000,
    stalledInterval: 60 * 1000,
  },
);

singleSceneWorker.on("completed", (job) =>
  Logger.info(`[SingleSceneWorker] Job ${job.id} completed`),
);
singleSceneWorker.on("failed", (job, err) =>
  Logger.error(`[SingleSceneWorker] Job ${job?.id} failed: ${err.message}`),
);
singleSceneWorker.on("error", (err) =>
  Logger.error(`[SingleSceneWorker] Worker error: ${err.message}`),
);
