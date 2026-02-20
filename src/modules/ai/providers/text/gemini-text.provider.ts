import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { MESSAGES } from "../../../../common/constants/messages.constant";
import { config } from "../../../../config/env.config";
import { AI_PROVIDERS, TEXT_MODELS } from "../../ai.constants";
import {
  ITextGenerator,
  TextPromptOptions,
} from "../../interfaces/text-generator.interface";


export class GeminiTextProvider implements ITextGenerator {
  private readonly genAI: GoogleGenerativeAI;
  private readonly apiKey: string;

  constructor() {
    this.apiKey = config.ai.geminiApiKey || "";
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  async generate(options: TextPromptOptions): Promise<string> {
    if (!this.apiKey) {
      throw new Error(MESSAGES.AI.GEMINI_API_KEY_MISSING);
    }

    try {
      // Use the model from options if provided, otherwise default
      const modelName =
        options.modelName || TEXT_MODELS.GEMINI_1_5_FLASH_LATEST; // Use latest version
      const model = this.genAI.getGenerativeModel({ model: modelName });

      const parts: any[] = [
        {
          text: options.systemPrompt
            ? `${options.systemPrompt}\n\n${options.prompt}`
            : options.prompt,
        },
      ];

      // Add images if provided
      if (options.imageUrls && options.imageUrls.length > 0) {
        const imageParts = await Promise.all(
          options.imageUrls.map(async (url) => {
            const response = await axios.get(url, {
              responseType: "arraybuffer",
            });
            return {
              inlineData: {
                data: Buffer.from(response.data).toString("base64"),
                mimeType: "image/jpeg", // Assume jpeg for now, or detect from headers
              },
            };
          }),
        );
        parts.push(...imageParts);
      }

      // Generate content with base options
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts,
          },
        ],
        generationConfig: {
          maxOutputTokens: options.maxTokens || 2048,
          temperature: options.temperature || 0.7,
        },
      });

      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error(MESSAGES.AI.GEMINI_GENERATION_FAILED);
      }

      return text;
    } catch (error: any) {
      console.error(`[GeminiTextProvider] Error:`, error);

      const errorMessage = error.message || "Unknown error";
      // Handle "model not found" specific messaging to guide the user
      if (errorMessage.includes("not found")) {
        throw new Error(
          `Gemini Error: The model '${TEXT_MODELS.GEMINI_1_5_FLASH}' might not be available for your API key or region. Try 'gemini-1.5-flash-latest'.`,
        );
      }

      throw new Error(
        `${MESSAGES.AI.GEMINI_GENERATION_FAILED}: ${errorMessage}`,
      );
    }
  }

  getProviderName(): string {
    return AI_PROVIDERS.GEMINI;
  }
}
