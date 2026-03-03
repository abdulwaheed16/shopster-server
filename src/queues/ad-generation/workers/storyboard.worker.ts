import { Worker } from "bullmq";
import { connection, QUEUE_NAMES } from "../../../config/queue.config";
import { StoryboardJobData } from "../types/job-data.types";
import { createAdWorkerHandler } from "../utils/worker-handler";
import Logger from "../../../common/logging/logger";

export const storyboardWorker = new Worker<StoryboardJobData>(
  QUEUE_NAMES.STORYBOARD,
  createAdWorkerHandler(),
  {
    connection: connection as any,
    concurrency: 5,
    lockDuration: 5 * 60 * 1000,
    stalledInterval: 60 * 1000,
  },
);

storyboardWorker.on("completed", (job) =>
  Logger.info(`[StoryboardWorker] Job ${job.id} completed`),
);
storyboardWorker.on("failed", (job, err) =>
  Logger.error(`[StoryboardWorker] Job ${job?.id} failed: ${err.message}`),
);
storyboardWorker.on("error", (err) =>
  Logger.error(`[StoryboardWorker] Worker error: ${err.message}`),
);
