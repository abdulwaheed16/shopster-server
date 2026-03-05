import { MediaType } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Universal base — fields every job carries (internal only; not all sent to n8n)
// NOTE: `callbackUrl` and `timestamp` are NOT stored here — they are injected
//       at send-time by each processor (callbackUrl via N8NBaseProvider, timestamp
//       via Date.now()) to avoid stale values in retried jobs.
// ─────────────────────────────────────────────────────────────────────────────
export interface TaskProgress {
  type: string; // e.g. "BASE_IMAGE", "STORYBOARD", etc.
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
}

export interface BaseJobData {
  adId: string;
  userId: string;
  isDraft?: boolean;
  mediaType: MediaType;
  taskType?: string; // Current job type for worker routing
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"; // Overall ad status
  currentTask?: TaskProgress; // Granular task details for UI
}

// ─────────────────────────────────────────────────────────────────────────────
// BASE_IMAGE — generates the hero product image
// n8n receives: adId, categoryName, adType, productImages, modelImage?,
//               templateImage?, callbackUrl, timestamp
// ─────────────────────────────────────────────────────────────────────────────
export interface BaseImageJobData extends BaseJobData {
  taskType?: "BASE_IMAGE";
  categoryName: string;
  adType: string;
  products: Array<{
    productId: string;
    source: "STORE" | "UPLOADED";
    imageUrl: string;
  }>;
  productImages: string[];
  modelImage: string;
  templateId?: string;
  templateImage?: string;
  userPrompt?: string;
}

export interface ModelImageJobData extends BaseJobData {
  taskType?: "MODEL_IMAGE";
  gender: string;
  age: string;
  skinColor: string;
  userPrompt?: string;
}

export interface StoryboardJobData extends BaseJobData {
  taskType?: "STORYBOARD" | "ALL_SCENES";
  baseImage: string;
  storyboard: string;
  productDescription: string;
  templateId?: string;
  categoryName?: string;
  adType?: string;
  products?: Array<{
    productId: string;
    source: "STORE" | "UPLOADED";
    imageUrl: string;
  }>;
  productImages?: string[];
  userPrompt?: string;
}

export interface SingleSceneJobData extends BaseJobData {
  taskType?: "SINGLE_SCENE";
  targetSceneId: string;
  assembledPrompt: string;
  baseImage: string;
  productDescription?: string;
  userPrompt?: string;
}

export interface FinalVideoScene {
  id: number;
  image: string;
  description?: string;
}

export interface FinalVideoJobData extends BaseJobData {
  taskType?: "FINAL_VIDEO";
  adId: string;
  adType?: string;
  categoryName?: string;
  baseImageUrl: string;
  duration: number;
  storyboard: string;
  productDescription: string;
  videoScript: string;
  scenes: FinalVideoScene[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Discriminated union for all task types
// ─────────────────────────────────────────────────────────────────────────────
export interface AdTemplateJobData extends BaseJobData {
  taskType?: "AD_TEMPLATE";
  templateId: string;
  promptTemplate: string;
  referenceAdImage?: string;
  productImage?: string;
  variables?: string;
}

export type AdGenerationJobData =
  | BaseImageJobData
  | ModelImageJobData
  | StoryboardJobData
  | SingleSceneJobData
  | FinalVideoJobData
  | AdTemplateJobData;

// Helper: all valid task type literals
export type GenerationTaskType = AdGenerationJobData["taskType"];
