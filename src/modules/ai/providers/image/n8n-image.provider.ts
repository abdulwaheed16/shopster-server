import axios from "axios";
import { config } from "../../../../config/env.config";
import { AI_PROVIDERS } from "../../ai.constants";
import {
  IImageGenerator,
  ImageGenerationResult,
  ImagePromptOptions,
} from "../../interfaces/image-generator.interface";

/**
 * STRATEGY: n8n Image Generation Provider
 * Forwards ad generation requests to an external n8n workflow.
 * This allows for complex, multi-step generation flows that are
 * managed outside the main application codebase.
 */
export class N8NImageProvider implements IImageGenerator {
  async generate(
    options: ImagePromptOptions,
  ): Promise<ImageGenerationResult[]> {
    const webhookUrl = config.webhook.n8nUrl;

    if (!webhookUrl) {
      throw new Error("n8n Webhook URL is not configured (N8N_WEBHOOK_URL)");
    }

    try {
      console.log(`[N8NImageProvider] Sending request to n8n: ${webhookUrl}`);

      const response = await axios.post(webhookUrl, {
        ...options,
        mediaType: "IMAGE",
        timestamp: new Date().toISOString(),
      });

      // Expected format: array of { imageUrl: string } or an object with { images: string[] }
      // We'll normalize it to ImageGenerationResult[]
      const data = response.data;

      console.log("[N8NImageProvider] Response from n8n:", data);

      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          imageUrl: item.imageUrl || item.url || item,
          metadata: item.metadata || {},
        }));
      }

      if (data.images && Array.isArray(data.images)) {
        return data.images.map((url: string) => ({
          imageUrl: url,
        }));
      }

      if (data.imageUrl || data.url) {
        return [{ imageUrl: data.imageUrl || data.url }];
      }

      // If it's a single URL string
      if (typeof data === "string" && data.startsWith("http")) {
        return [{ imageUrl: data }];
      }

      throw new Error("Invalid response format from n8n webhook");
    } catch (error: any) {
      console.error(
        "[N8NImageProvider] n8n webhook request failed:",
        error.response?.data || error.message,
      );
      throw new Error(`n8n generation failed: ${error.message}`);
    }
  }

  getProviderName(): string {
    return AI_PROVIDERS.N8N;
  }
}
