export interface TextPromptOptions {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  imageUrls?: string[];
  modelName?: string;
}

export interface ITextGenerator {
  generate(options: TextPromptOptions): Promise<string>;
  getProviderName(): string;
}
