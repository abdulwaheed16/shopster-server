import { MediaType } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Universal base — fields every job carries (internal only; not all sent to n8n)
// NOTE: `callbackUrl` and `timestamp` are NOT stored here — they are injected
//       at send-time by each processor (callbackUrl via N8NBaseProvider, timestamp
//       via Date.now()) to avoid stale values in retried jobs.
// ─────────────────────────────────────────────────────────────────────────────
export interface BaseJobData {
  adId: string;
  userId: string;
  isDraft: boolean;
  mediaType: MediaType;
  currentTask: { name: string; status: string };
}

// ─────────────────────────────────────────────────────────────────────────────
// BASE_IMAGE — generates the hero product image
// n8n receives: adId, categoryName, adType, productImages, modelImage?,
//               templateImage?, callbackUrl, timestamp
// ─────────────────────────────────────────────────────────────────────────────
export interface BaseImageJobData extends BaseJobData {
  taskType: "BASE_IMAGE";
  categoryName: string;
  adType: string;
  products: Array<{
    productId: string;
    source: "STORE" | "UPLOADED";
    imageUrl: string;
  }>;
  productImages: string[];
  modelImage: string;
  templateImage?: string;
  userPrompt?: string;
  productDescription?: string;
}

export interface ModelImageJobData extends BaseJobData {
  taskType: "MODEL_IMAGE";
  gender: string;
  age: string;
  skinColor: string;
  userPrompt?: string;
}

export interface StoryboardJobData extends BaseJobData {
  taskType: "STORYBOARD" | "ALL_SCENES";
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
}

export interface SingleSceneJobData extends BaseJobData {
  taskType: "SINGLE_SCENE";
  targetSceneId: string;
  assembledPrompt: string;
  baseImage: string;
  productDescription?: string;
}

export interface FinalVideoScene {
  order: number;
  image: string;
  description: string;
}

export interface FinalVideoJobData extends BaseJobData {
  taskType: "FINAL_VIDEO";
  baseImage: string;
  storyboard: string;
  productDescription: string;
  scenes: FinalVideoScene[];
  categoryName?: string;
  adType?: string;
  duration?: number;
  aspectRatio?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Discriminated union for all task types
// ─────────────────────────────────────────────────────────────────────────────
export interface AdTemplateJobData extends BaseJobData {
  taskType: "AD_TEMPLATE";
  templateId: string;
  promptTemplate: string;
  referenceAdImage?: string;
  productImage?: string;
  variables?: any;
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
