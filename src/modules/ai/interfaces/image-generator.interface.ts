import { AspectRatio, StylePreset } from "../ai.constants";

export interface ImagePromptOptions {
  prompt: string;
  aspectRatio?: AspectRatio | string;
  imageSize?: string;
  variants?: number;
  negativePrompt?: string;
  seed?: number;
  style?: StylePreset | string;
  color?: string;
  imageUrls?: string[];
  adId?: string;
  modelId?: string;
  productImages?: string[];
  templateImage?: string;
  templatePrompt?: string;
  userPrompt?: string;
  modelImage?: string;
}

export interface ImageGenerationResult {
  imageUrl: string;
  metadata?: Record<string, any>;
}

export interface IImageGenerator {
  generate(options: ImagePromptOptions): Promise<ImageGenerationResult[]>;
  getProviderName(): string;
}
