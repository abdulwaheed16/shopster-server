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
    const webhookUrl = this.resolveWebhookUrl(
      options.taskType,
      options.mediaType,
    );

    const payload: ImageGenerationPayload = {
      adId: options.adId,
      isDraft: options.isDraft,
      taskType: options?.taskType,
      userPrompt: options?.userPrompt || options?.prompt,
      productImages: options.productImages,
      modelImage: options.modelImage,
      categoryName: (options as any).category,
      adType: (options as any).adType,
      aspectRatio: options.aspectRatio,
      variants: options.variants ?? 1,
      style: options.style,
      color: options.color,
      mediaType: options.mediaType || "IMAGE",
      productDescription: (options as any).productDescription,
      targetSceneId: (options as any).targetSceneId,
      baseImage: (options as any).baseImage || (options as any).baseImageUrl,
      storyboard: (options as any).storyboard,
      timestamp: new Date().toISOString(),
    };

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
