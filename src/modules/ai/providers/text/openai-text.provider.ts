import axios from "axios";
import { MESSAGES } from "../../../../common/constants/messages.constant";
import { config } from "../../../../config/env.config";
import { AI_BASE_URLS, AI_PROVIDERS, TEXT_MODELS } from "../../ai.constants";
import {
  ITextGenerator,
  TextPromptOptions,
} from "../../interfaces/text-generator.interface";

/**
 * CONCRETE STRATEGY: OpenAITextProvider
 */
export class OpenAITextProvider implements ITextGenerator {
  private readonly apiKey: string;
  private readonly baseUrl = AI_BASE_URLS.OPENAI;

  constructor() {
    this.apiKey = config.ai.openAiApiKey || "";
  }

  getProviderName(): string {
    return AI_PROVIDERS.OPENAI;
  }

  async generate(options: TextPromptOptions): Promise<string> {
    if (!this.apiKey) {
      throw new Error(MESSAGES.AI.OPENAI_API_KEY_MISSING);
    }

    try {
      const response = await axios.post(
        this.baseUrl,
        {
          model: TEXT_MODELS.GPT_4_TURBO,
          messages: [
            {
              role: "system",
              content:
                options.systemPrompt || "You are a creative ad copywriter.",
            },
            { role: "user", content: options.prompt },
          ],
          max_tokens: options.maxTokens || 500,
          temperature: options.temperature || 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error: any) {
      console.error(
        `[OpenAITextProvider] ${MESSAGES.AI.TEXT_GENERATION_FAILED}:`,
        error.response?.data || error.message
      );
      throw new Error(
        `${MESSAGES.AI.TEXT_GENERATION_FAILED}: ${error.message}`
      );
    }
  }
}
