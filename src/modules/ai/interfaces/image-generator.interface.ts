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
  variants?: number;
  negativePrompt?: string;
  seed?: number;
  style?: StylePreset | string;
  color?: string;

  // Legacy field for backward compatibility with existing workflows
  // Prefer using the specific fields below (productImages, templateImage, modelImage)
  imageUrls?: string[];

  adId?: string; // Optional context for the ad being generated
  modelId?: string; // Allow overriding the default model

  // Specific image fields for structured n8n payload
  productImages?: string[]; // Array of product images to showcase
  templateImage?: string; // Reference template/style image
  templatePrompt?: string; // Original template prompt text
  userPrompt?: string; // User's custom instructions/thoughts
  modelImage?: string; // Actor/model image for ad representation
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
