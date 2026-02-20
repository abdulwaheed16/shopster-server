export interface VideoPromptOptions {
  prompt: string;
  duration?: number;
  fps?: number;
  aspectRatio?: string;
  scenes?: string[];
  style?: string;
  color?: string;
  adId?: string;
  productImages?: string[];
  templateImage?: string;
  templatePrompt?: string;
  modelImage?: string;
}

export interface VideoGenerationResult {
  videoUrl: string;
  metadata?: Record<string, any>;
}

export interface IVideoGenerator {
  generate(options: VideoPromptOptions): Promise<VideoGenerationResult>;
  getProviderName(): string;
}
