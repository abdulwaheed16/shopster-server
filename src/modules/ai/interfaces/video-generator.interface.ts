/**
 * STRATEGY PATTERN: Video Generation Interface
 */

export interface VideoPromptOptions {
  prompt: string;
  duration?: number;
  fps?: number;
  aspectRatio?: string;
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
