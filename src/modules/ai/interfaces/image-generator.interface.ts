/**
 * STRATEGY PATTERN: Image Generation Interface
 * Defines the contract that all image generation providers must follow.
 * Decoupled from specific AI model implementations (e.g., fal.ai, DALL-E, etc.).
 */

import { AspectRatio, StylePreset } from "../ai.constants";

export interface ImagePromptOptions {
  prompt: string;
  aspectRatio?: AspectRatio | string;
  imageSize?: string;
  numImages?: number;
  negativePrompt?: string;
  seed?: number;
  style?: StylePreset | string;
  color?: string;
  imageUrls?: string[]; // For image-to-image or editing (e.g., Template + Product)
  modelId?: string; // Allow overriding the default model
  adId?: string; // Optional context for the ad being generated
}

export interface ImageGenerationResult {
  imageUrl: string;
  metadata?: Record<string, any>;
}

export interface IImageGenerator {
  // Generates one or more images based on the provided options.
  generate(options: ImagePromptOptions): Promise<ImageGenerationResult[]>;

  // Returns the identifier of the provider (e.g., 'fal-ai', 'openai').
  getProviderName(): string;
}
