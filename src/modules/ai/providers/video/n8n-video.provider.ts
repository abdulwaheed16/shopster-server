import axios from "axios";
import { config } from "../../../../config/env.config";
import { AI_PROVIDERS } from "../../ai.constants";
import { VideoGenerationPayload } from "../../interfaces/n8n.interface";
import {
  IVideoGenerator,
  VideoGenerationResult,
  VideoPromptOptions,
} from "../../interfaces/video-generator.interface";

/**
 * STRATEGY: n8n Video Generation Provider
 * Forwards video generation requests to an external n8n workflow.
 */
export class N8NVideoProvider implements IVideoGenerator {
  async generate(options: VideoPromptOptions): Promise<VideoGenerationResult> {
    const webhookUrl = config.webhook.n8nUrl;

    if (!webhookUrl) {
      throw new Error("n8n Webhook URL is not configured (N8N_WEBHOOK_URL)");
    }

    try {
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
        duration: options.duration || 10,
        timestamp: new Date().toISOString(),
      };

      console.log("[N8NVideoProvider] Request payload:", payload);

      const response = await axios.post(webhookUrl, payload);

      const data = response.data;

      // Expected format: { videoUrl: string } or an object with { url: string }
      if (data.videoUrl || data.url) {
        return {
          videoUrl: data.videoUrl || data.url,
          metadata: data.metadata || {},
        };
      }

      // If it's a single URL string
      if (typeof data === "string" && data.startsWith("http")) {
        return { videoUrl: data };
      }

      throw new Error("Invalid response format from n8n webhook for video");
    } catch (error: any) {
      const is404 = error.response?.status === 404;
      const data = error.response?.data;
      const isTestModeError =
        typeof data === "string" && data.includes("No workspace here");

      if (is404 || isTestModeError) {
        console.error(
          "[N8NVideoProvider] 404 Error: The n8n webhook returned 404. " +
            (webhookUrl.includes("webhook-test")
              ? "This usually means the n8n workflow is not in 'Test' mode. Please click 'Test Workflow' in n8n and try again."
              : "Please check if the webhook URL is correct and the workflow is active."),
        );
      }

      console.error(
        "[N8NVideoProvider] n8n webhook request failed:",
        data || error.message,
      );
      throw new Error(
        `n8n video generation failed: ${error.message}${isTestModeError ? " (Possible n8n test mode timeout)" : ""}`,
      );
    }
  }

  getProviderName(): string {
    return AI_PROVIDERS.N8N;
  }
}
