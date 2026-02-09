/**
 * STRATEGY PATTERN: Video Generation Interface
 */

export interface VideoPromptOptions {
  prompt: string;
  duration?: number;
  fps?: number;
  aspectRatio?: string;
  videoType?: string;
  style?: string;
  color?: string;
  imageUrls?: string[];
  modelId?: string;
  adId?: string;
}

export interface VideoGenerationResult {
  videoUrl: string;
  metadata?: Record<string, any>;
}

export interface IVideoGenerator {
  // Generates a video based on the provided options.
  generate(options: VideoPromptOptions): Promise<VideoGenerationResult>;

  // Returns the identifier of the provider.
  getProviderName(): string;
}
