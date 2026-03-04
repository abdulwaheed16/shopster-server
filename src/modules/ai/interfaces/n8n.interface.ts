import { MediaType } from "@prisma/client";
import { AspectRatio, StylePreset } from "../ai.constants";

export interface N8NBasePayload {
  adId?: string;
  productImages?: string[];
  aspectRatio?: AspectRatio | string;
  style?: StylePreset | string;
  color?: string;
  timestamp: string;
  callbackUrl?: string;
  taskType?: string;
}

export interface ImageGenerationPayload extends N8NBasePayload {
  mediaType: MediaType | "IMAGE";
  variants: number;
  userPrompt?: string;
  templatePrompt?: string;
  templateImage?: string;
  modelImage?: string;
  categoryName?: string;
  adType?: string;
  productDescription?: string;
  targetSceneId?: string;
  baseImage?: string;
  storyboard?: string;
}

export interface VideoGenerationPayload extends N8NBasePayload {
  mediaType: MediaType;
  duration: number;
  scenes?: any[];
  videoScript?: {
    type: "TEXT" | "VOICE";
    content: string;
  };
  storyboard?: string;
  baseImage?: string;
  productDescription?: string;
  userPrompt?: string;
  targetSceneId?: string;
}

export interface N8NImageResult {
  url: string;
  content_type: string;
  file_name: string;
  file_size: number | null;
  width: number | null;
  height: number | null;
}

export interface N8NImageResponse {
  images: N8NImageResult[];
  description?: string;
}

export interface N8NVideoResult {
  url: string;
  content_type: string;
  file_name: string;
  file_size: number | null;
  width: number | null;
  height: number | null;
  duration?: number | null;
}

export interface N8NVideoResponse {
  videos: N8NVideoResult[];
  description?: string;
}

export type N8NMediaResponse = N8NImageResponse | N8NVideoResponse;
