import axios from "axios";
import { MESSAGES } from "../../../../common/constants/messages.constant";
import { config } from "../../../../config/env.config";
import {
  AI_BASE_URLS,
  AI_PROVIDERS,
  ASPECT_RATIOS,
  AspectRatio,
  IMAGE_MODELS,
} from "../../ai.constants";
import {
  IImageGenerator,
  ImageGenerationResult,
  ImagePromptOptions,
} from "../../interfaces/image-generator.interface";

/**
 * CONCRETE STRATEGY: FalAIProvider
 */
export class FalAIProvider implements IImageGenerator {
  private readonly apiKey: string;
  private readonly baseUrl = AI_BASE_URLS.FAL_AI;

  constructor() {
    this.apiKey = config.ai.falApiKey || "";
  }

  getProviderName(): string {
    return AI_PROVIDERS.FAL_AI;
  }

  async generate(
    options: ImagePromptOptions
  ): Promise<ImageGenerationResult[]> {
    if (!this.apiKey) {
      throw new Error(MESSAGES.AI.FAL_API_KEY_MISSING);
    }

    try {
      const modelId = options.modelId || IMAGE_MODELS.FAL_AI_FAST_SDXL;

      // Enhance prompt with style and color if provided
      let enhancedPrompt = options.prompt;
      if (options.style) enhancedPrompt += `, style: ${options.style}`;
      if (options.color)
        enhancedPrompt += `, primary color theme: ${options.color}`;

      const payload: any = {
        prompt: enhancedPrompt,
        num_inference_steps: 25,
        num_images: options.numImages || 1,
        enable_safety_checker: true,
      };

      // Handle image_urls (Nano Banana Edit uses this)
      if (options.imageUrls && options.imageUrls.length > 0) {
        payload.image_urls = options.imageUrls;
      }

      // Handle image_size if not using image_urls (standard generation)
      if (!options.imageUrls) {
        payload.image_size = this.mapAspectRatio(options.aspectRatio);
      }

      const response = await axios.post(`${this.baseUrl}/${modelId}`, payload, {
        headers: {
          Authorization: `Key ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      const images = response.data.images || [];

      return images.map((img: any) => ({
        imageUrl: img.url,
        metadata: {
          width: img.width,
          height: img.height,
          contentType: img.content_type,
          requestId: response.data.request_id,
        },
      }));
    } catch (error: any) {
      console.error(
        `[FalAIProvider] ${MESSAGES.AI.GENERATION_FAILED}:`,
        error.response?.data || error.message
      );
      throw new Error(`${MESSAGES.AI.GENERATION_FAILED}: ${error.message}`);
    }
  }

  private mapAspectRatio(ratio?: AspectRatio | string): string {
    switch (ratio) {
      // 1:1
      case ASPECT_RATIOS.SQUARE:
        return ASPECT_RATIOS.SQUARE;

      // 16:9
      case ASPECT_RATIOS.LANDSCAPE:
        return ASPECT_RATIOS.LANDSCAPE;

      // 9:16
      case ASPECT_RATIOS.STORY:
        return ASPECT_RATIOS.STORY;

      // 4:5
      case ASPECT_RATIOS.PORTRAIT:
        return ASPECT_RATIOS.PORTRAIT;

      default:
        return ASPECT_RATIOS.SQUARE;
    }
  }
}
