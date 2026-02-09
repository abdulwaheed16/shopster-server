import axios from "axios";
import { config } from "../../../../config/env.config";
import { AI_PROVIDERS } from "../../ai.constants";
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
      console.log(`[N8NVideoProvider] Sending request to n8n: ${webhookUrl}`);

      const response = await axios.post(webhookUrl, {
        ...options,
        mediaType: "VIDEO",
        timestamp: new Date().toISOString(),
      });

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
      console.error(
        "[N8NVideoProvider] n8n webhook request failed:",
        error.response?.data || error.message,
      );
      throw new Error(`n8n video generation failed: ${error.message}`);
    }
  }

  getProviderName(): string {
    return AI_PROVIDERS.N8N;
  }
}
