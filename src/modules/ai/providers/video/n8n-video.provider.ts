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
    const webhookUrl = this.resolveWebhookUrl(
      options.taskType,
      options.mediaType,
    );

    const payload: VideoGenerationPayload = {
      adId: options.adId,
      scenes: options.scenes,
      productImages: options.productImages,
      aspectRatio: options.aspectRatio,
      style: options.style,
      color: options.color,
      mediaType: options.mediaType || "VIDEO",
      duration: options.duration ?? 10,
      videoScript: options.videoScript,
      storyboard: options.storyboard,
      baseImage: options.baseImage || (options as any).baseImageUrl,
      productDescription: (options as any).productDescription,
      targetSceneId: (options as any).targetSceneId,
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
