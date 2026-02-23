import { AI_PROVIDERS } from "../../ai.constants";
import {
  IImageGenerator,
  ImageGenerationResult,
  ImagePromptOptions,
} from "../../interfaces/image-generator.interface";
import { ImageGenerationPayload } from "../../interfaces/n8n.interface";
import { N8NBaseProvider } from "../n8n-base.provider";

export class N8NImageProvider
  extends N8NBaseProvider
  implements IImageGenerator
{
  protected readonly logPrefix = "[N8NImageProvider]";

  async generate(
    options: ImagePromptOptions,
  ): Promise<ImageGenerationResult[]> {
    const webhookUrl = this.resolveWebhookUrl();

    const payload: ImageGenerationPayload = {
      adId: options.adId,
      userPrompt: options.userPrompt || options.prompt,
      templatePrompt: options.templatePrompt,
      templateImage: options.templateImage,
      productImages: options.productImages,
      aspectRatio: options.aspectRatio,
      variants: options.variants ?? 1,
      style: options.style,
      color: options.color,
      mediaType: "IMAGE",
      timestamp: new Date().toISOString(),
    };

    console.log("Image Generation Payload:", payload);

    await this.fireAndForget(webhookUrl, payload);

    // Return a pending marker — the real result arrives via POST /api/ads/n8n-callback
    return [
      {
        imageUrl: "",
        metadata: {
          pending: true,
          adId: options.adId,
          acknowledgedAt: new Date().toISOString(),
        },
      },
    ];
  }

  getProviderName(): string {
    return AI_PROVIDERS.N8N;
  }
}
