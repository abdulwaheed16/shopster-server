import { MESSAGES } from "../../common/constants/messages.constant";
import { AI_PROVIDERS } from "./ai.constants";
import { IImageGenerator } from "./interfaces/image-generator.interface";
import { ITextGenerator } from "./interfaces/text-generator.interface";
import { IVideoGenerator } from "./interfaces/video-generator.interface";
import { FalAIProvider } from "./providers/image/fal-ai.provider";
import { GeminiTextProvider } from "./providers/text/gemini-text.provider";
import { OpenAITextProvider } from "./providers/text/openai-text.provider";

/**
 * FACTORY PATTERN: AIFactory
 * This class is responsible for instantiating the correct AI providers.
 * It decouples the rest of the application from the instantiation logic,
 * making it easy to change providers based on configuration or user preferences
 * without modifying the core business logic.
 */

export class AIFactory {
  // Returns a concrete implementation of IImageGenerator.
  static getImageGenerator(
    provider: string = AI_PROVIDERS.FAL_AI
  ): IImageGenerator {
    switch (provider.toLowerCase()) {
      case AI_PROVIDERS.FAL_AI:
        return new FalAIProvider();
      // other providers i.e. OpenAI, Midjourney, etc.
      // case AI_PROVIDERS.OPENAI:
      //   return new OpenAIImageProvider();
      default:
        throw new Error(`${MESSAGES.AI.UNSUPPORTED_PROVIDER}: ${provider}`);
    }
  }

  // Returns a concrete implementation of IVideoGenerator.
  static getVideoGenerator(provider: string): IVideoGenerator {
    switch (provider.toLowerCase()) {
      //   case AI_PROVIDERS.SORA:
      //     return new SoraVideoProvider();
      default:
        throw new Error(`${MESSAGES.AI.UNSUPPORTED_PROVIDER}: ${provider}`);
    }
  }

  // Returns a concrete implementation of ITextGenerator.
  static getTextGenerator(
    provider: string = AI_PROVIDERS.GEMINI
  ): ITextGenerator {
    switch (provider.toLowerCase()) {
      case AI_PROVIDERS.OPENAI:
        return new OpenAITextProvider();
      case AI_PROVIDERS.GEMINI:
        return new GeminiTextProvider();
      default:
        throw new Error(`${MESSAGES.AI.UNSUPPORTED_PROVIDER}: ${provider}`);
    }
  }
}
