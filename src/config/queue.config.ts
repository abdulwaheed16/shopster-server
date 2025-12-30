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
  AD_GENERATION: "ad-generation",
  TEMPLATE_PREVIEW: "template-preview",
  SHOPIFY_SYNC: "shopify-sync",
} as const;

// Create queues
export const adGenerationQueue = new Queue(QUEUE_NAMES.AD_GENERATION, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 3600, // 24 hours
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed jobs
    },
  },
});

export const templatePreviewQueue = new Queue(QUEUE_NAMES.TEMPLATE_PREVIEW, {
  connection,
  defaultJobOptions: {
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
  },
});

export const shopifySyncQueue = new Queue(QUEUE_NAMES.SHOPIFY_SYNC, {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: {
      count: 50,
      age: 7 * 24 * 3600, // 7 days
    },
    removeOnFail: {
      count: 100,
    },
  },
});

// Export connection for workers
export { connection };
