import { MESSAGES } from "../../common/constants/messages.constant";
import { AI_PROVIDERS } from "./ai.constants";
import { IImageGenerator } from "./interfaces/image-generator.interface";
import { ITextGenerator } from "./interfaces/text-generator.interface";
import { IVideoGenerator } from "./interfaces/video-generator.interface";
import { MockImageProvider } from "./providers/image/mock-image.provider";
import { N8NImageProvider } from "./providers/image/n8n-image.provider";
import { MockTextProvider } from "./providers/text/mock-text.provider";
import { MockVideoProvider } from "./providers/video/mock-video.provider";
import { N8NVideoProvider } from "./providers/video/n8n-video.provider";

export class AIFactory {
  static getImageGenerator(
    provider: string = AI_PROVIDERS.FAL_AI,
  ): IImageGenerator {
    switch (provider.toLowerCase()) {
      // case AI_PROVIDERS.FAL_AI:
      //   return new FalAIProvider();
      case AI_PROVIDERS.N8N:
        return new N8NImageProvider();
      case AI_PROVIDERS.MOCK:
        return new MockImageProvider();
      default:
        throw new Error(`${MESSAGES.AI.UNSUPPORTED_PROVIDER}: ${provider}`);
    }
  }

  static getVideoGenerator(provider: string): IVideoGenerator {
    switch (provider.toLowerCase()) {
      case AI_PROVIDERS.N8N:
        return new N8NVideoProvider();
      case AI_PROVIDERS.MOCK:
        return new MockVideoProvider();
      default:
        throw new Error(`${MESSAGES.AI.UNSUPPORTED_PROVIDER}: ${provider}`);
    }
  }

  static getTextGenerator(
    provider: string = AI_PROVIDERS.GEMINI,
  ): ITextGenerator {
    switch (provider.toLowerCase()) {
      // case AI_PROVIDERS.OPENAI:
      //   return new OpenAITextProvider();
      // case AI_PROVIDERS.GEMINI:
      //   return new GeminiTextProvider();
      case AI_PROVIDERS.MOCK:
        return new MockTextProvider();
      default:
        throw new Error(`${MESSAGES.AI.UNSUPPORTED_PROVIDER}: ${provider}`);
    }
  }
}
