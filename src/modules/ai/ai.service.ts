import { AI_PROVIDERS, TEXT_MODELS } from "./ai.constants";
import { AIFactory } from "./ai.factory";
import { AD_PROMPT_ENGINEERING, AD_VISION_PROMPTS } from "./ai.prompts";
import {
  ImageGenerationResult,
  ImagePromptOptions,
} from "./interfaces/image-generator.interface";
import { TextPromptOptions } from "./interfaces/text-generator.interface";
import {
  VideoGenerationResult,
  VideoPromptOptions,
} from "./interfaces/video-generator.interface";

export class AIService {
  // High-level method to generate images.
  async generateImage(
    options: ImagePromptOptions,
    provider: string = AI_PROVIDERS.MOCK,
  ): Promise<ImageGenerationResult[]> {
    const generator = AIFactory.getImageGenerator(provider);
    return generator.generate(options);
  }

  // High-level method to generate videos.
  async generateVideo(
    options: VideoPromptOptions,
    provider: string = AI_PROVIDERS.MOCK,
  ): Promise<VideoGenerationResult> {
    const generator = AIFactory.getVideoGenerator(provider);
    return generator.generate(options);
  }

  // High-level method to generate text.
  async generateText(
    options: TextPromptOptions,
    provider: string = AI_PROVIDERS.OPENAI,
  ): Promise<string> {
    const generator = AIFactory.getTextGenerator(provider);
    return generator.generate(options);
  }

  /**
   * Generic Image Analysis (Vision)
   * Uses Gemini-2.0-Flash to analyze any image with the standard ad analysis schema.
   */
  async analyzeImage(imageUrl: string): Promise<string> {
    return this.generateText(
      {
        prompt: AD_VISION_PROMPTS.ANALYZER_TASK,
        systemPrompt: `${AD_VISION_PROMPTS.ANALYZER_ROLE}\n\nSchema:\n${AD_VISION_PROMPTS.ANALYZER_SCHEMA}\n\nOutput Format: ${AD_VISION_PROMPTS.ANALYZER_FORMAT}`,
        imageUrls: [imageUrl],
        modelName: TEXT_MODELS.GEMINI_2_5_FLASH,
      },
      AI_PROVIDERS.GEMINI,
    );
  }

  /**
   * Specialized method for Ad Template Analysis (Vision)
   * Alias for analyzeImage for better readability in context.
   */
  async analyzeAdTemplate(templateImageUrl: string): Promise<string> {
    return this.analyzeImage(templateImageUrl);
  }

  /**
   * Specialized method for analyzing a generated ad result.
   */
  async analyzeGeneratedAd(adImageUrl: string): Promise<string> {
    return this.analyzeImage(adImageUrl);
  }

  /**
   * Specialized method for Ad Prompt Construction
   * Synthesizes user instructions and template analysis into a generation prompt.
   */
  async constructAdPrompt(
    userInstructions: string,
    visionAnalysis: string,
  ): Promise<{ imagePrompt: string; aspectRatio: string }> {
    const result = await this.generateText(
      {
        prompt: AD_PROMPT_ENGINEERING.CONSTRUCT_USER_PROMPT(
          userInstructions,
          visionAnalysis,
        ),
        systemPrompt: AD_PROMPT_ENGINEERING.SYSTEM_MESSAGE,
        modelName: TEXT_MODELS.GEMINI_2_5_FLASH,
      },
      AI_PROVIDERS.GEMINI,
    );

    // Parse the result (which should be JSON or raw YAML-like string)
    try {
      // Clean potential markdown fences
      const cleanResult = result
        .replace(/```json/gi, "")
        .replace(/```yaml/gi, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(cleanResult);
      const scene = parsed.scenes?.[0] || {};

      return {
        imagePrompt: scene.image_prompt || cleanResult,
        aspectRatio: scene.aspect_ratio_image || "2:3",
      };
    } catch (e) {
      console.warn(
        "[AIService] Failed to parse prompt construction result:",
        e,
      );
      return {
        imagePrompt: result,
        aspectRatio: "2:3",
      };
    }
  }
}

export const aiService = new AIService();
