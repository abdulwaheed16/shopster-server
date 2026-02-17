/**
 * STRATEGY PATTERN: Video Generation Interface
 */

export interface VideoPromptOptions {
  prompt: string;
  duration?: number;
  fps?: number;
  aspectRatio?: string;
  scenes?: string[]; // Array of scenes for video generation
  style?: string;
  color?: string;
  adId?: string;
  productImages?: string[]; // Array of product images to showcase
  templateImage?: string; // Reference template/style image
  templatePrompt?: string; // Original template prompt text
  modelImage?: string; // Actor/model image for video representation
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
