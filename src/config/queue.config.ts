import { Queue } from "bullmq";
import IORedis from "ioredis";
import { config } from "./env.config";

// Create Redis connection
const connection = new IORedis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null, // Required for BullMQ
});

// Test connection
connection.on("connect", () => {
  console.log("Redis connected successfully");
});

connection.on("error", (err) => {
  console.error("Redis connection error:", err);
});

// Queue names
export const QUEUE_NAMES = {
  BASE_IMAGE: "ad-base-image",
  MODEL_IMAGE: "ad-model-image",
  STORYBOARD: "ad-storyboard",
  SINGLE_SCENE: "ad-single-scene",
  FINAL_VIDEO: "ad-final-video",
  AD_TEMPLATE: "ad-template",
  TEMPLATE_PREVIEW: "template-preview",
  SHOPIFY_SYNC: "shopify-sync",
} as const;

// Shared job option presets
const commonJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 2000,
  },
  removeOnComplete: {
    count: 100,
    age: 24 * 3600,
  },
  removeOnFail: {
    count: 500,
  },
};

const imageJobOptions = { ...commonJobOptions };
const videoJobOptions = {
  ...commonJobOptions,
  backoff: {
    type: "exponential",
    delay: 5000,
  },
};

// Create queues
export const baseImageQueue = new Queue(QUEUE_NAMES.BASE_IMAGE, {
  connection: connection as any,
  defaultJobOptions: imageJobOptions,
});

export const modelImageQueue = new Queue(QUEUE_NAMES.MODEL_IMAGE, {
  connection: connection as any,
  defaultJobOptions: imageJobOptions,
});

export const storyboardQueue = new Queue(QUEUE_NAMES.STORYBOARD, {
  connection: connection as any,
  defaultJobOptions: imageJobOptions,
});

export const singleSceneQueue = new Queue(QUEUE_NAMES.SINGLE_SCENE, {
  connection: connection as any,
  defaultJobOptions: imageJobOptions,
});

export const finalVideoQueue = new Queue(QUEUE_NAMES.FINAL_VIDEO, {
  connection: connection as any,
  defaultJobOptions: videoJobOptions,
});

export const adTemplateQueue = new Queue(QUEUE_NAMES.AD_TEMPLATE, {
  connection: connection as any,
  defaultJobOptions: imageJobOptions,
});

export const templatePreviewQueue = new Queue(QUEUE_NAMES.TEMPLATE_PREVIEW, {
  connection: connection as any,
  defaultJobOptions: imageJobOptions,
});

export const shopifySyncQueue = new Queue(QUEUE_NAMES.SHOPIFY_SYNC, {
  connection: connection as any,
  defaultJobOptions: commonJobOptions,
});

/** @deprecated Use finalVideoQueue or specific task queues */
export const adGenerationQueue = finalVideoQueue;

// Export connection for workers
export { connection };
