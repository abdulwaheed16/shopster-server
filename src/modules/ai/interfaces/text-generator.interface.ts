/**
 * STRATEGY PATTERN: Text Generation Interface
 */

export interface TextPromptOptions {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  imageUrls?: string[]; // For vision analysis
  modelName?: string; // Allow overriding the default model
}

export interface ITextGenerator {
  // Generates text based on the provided options.
  generate(options: TextPromptOptions): Promise<string>;

  // Returns the identifier of the provider.
  getProviderName(): string;
}
