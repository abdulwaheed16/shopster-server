import { AI_PROVIDERS } from "../../ai.constants";
import { VideoGenerationPayload } from "../../interfaces/n8n.interface";
import {
  IVideoGenerator,
  VideoGenerationResult,
  VideoPromptOptions,
} from "../../interfaces/video-generator.interface";
import { N8NBaseProvider } from "../n8n-base.provider";

export class N8NVideoProvider
  extends N8NBaseProvider
  implements IVideoGenerator
{
  protected readonly logPrefix = "[N8NVideoProvider]";

  async generate(options: VideoPromptOptions): Promise<VideoGenerationResult> {
    const webhookUrl = this.resolveWebhookUrl();

    const payload: VideoGenerationPayload = {
      adId: options.adId,
      scenes: options.scenes,
      templatePrompt: options.templatePrompt,
      templateImage: options.templateImage,
      productImages: options.productImages,
      modelImage: options.modelImage,
      aspectRatio: options.aspectRatio,
      style: options.style,
      color: options.color,
      mediaType: "VIDEO",
      duration: options.duration ?? 10,
      videoScript: options.videoScript,
      timestamp: new Date().toISOString(),
    };

    console.log("Video Generation Payload:", payload);

    await this.fireAndForget(webhookUrl, payload);

    // Return a pending marker — the real result arrives via POST /api/ads/n8n-callback
    return {
      videoUrl: "",
      metadata: {
        pending: true,
        adId: options.adId,
        acknowledgedAt: new Date().toISOString(),
      },
    };
  }

  getProviderName(): string {
    return AI_PROVIDERS.N8N;
  }
}
