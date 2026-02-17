import { AspectRatio, StylePreset } from "../ai.constants";

export interface N8NBasePayload {
  adId?: string;
  templatePrompt?: string;
  templateImage?: string;
  productImages?: string[];
  aspectRatio?: AspectRatio | string;
  style?: StylePreset | string;
  color?: string;
  timestamp: string;
}

export interface ImageGenerationPayload extends N8NBasePayload {
  mediaType: "IMAGE";
  variants: number;
  userPrompt: string; // Keep for images if needed, or unify
}

export interface VideoGenerationPayload extends N8NBasePayload {
  mediaType: "VIDEO";
  modelImage?: string;
  duration: number;
  scenes?: string[];
}

/**
 * n8n Response Types
 */

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

// Union type for any n8n media response
export type N8NMediaResponse = N8NImageResponse | N8NVideoResponse;
