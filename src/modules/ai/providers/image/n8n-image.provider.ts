import axios from "axios";
import { config } from "../../../../config/env.config";
import { AI_PROVIDERS } from "../../ai.constants";
import {
  IImageGenerator,
  ImageGenerationResult,
  ImagePromptOptions,
} from "../../interfaces/image-generator.interface";
import { ImageGenerationPayload } from "../../interfaces/n8n.interface";

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

      const payload: ImageGenerationPayload = {
        adId: options.adId,
        userPrompt: options.userPrompt || options.prompt,
        templatePrompt: options.templatePrompt,
        templateImage: options.templateImage,
        productImages: options.productImages,
        aspectRatio: options.aspectRatio,
        variants: options.variants || 1,
        style: options.style,
        color: options.color,
        mediaType: "IMAGE",
        timestamp: new Date().toISOString(),
      };

      console.log("[N8NImageProvider] Request payload:", payload);

      const response = await axios.post(webhookUrl, payload);

      console.log("[N8NImageProvider] Response from n8n:", response.data);

      // Parse n8n response using typed interface
      const data = response.data as any;

      // Handle n8n response format: { images: [{ url, content_type, ... }], description }
      if (data.images && Array.isArray(data.images)) {
        return data.images.map((img: any) => ({
          imageUrl: img.url,
          metadata: {
            content_type: img.content_type,
            file_name: img.file_name,
            file_size: img.file_size,
            width: img.width,
            height: img.height,
          },
        }));
      }

      // Fallback: Handle array of URLs or objects
      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          imageUrl: item.imageUrl || item.url || item,
          metadata: item.metadata || {},
        }));
      }

      // Fallback: Handle single URL object
      if (data.imageUrl || data.url) {
        return [{ imageUrl: data.imageUrl || data.url }];
      }

      // Fallback: Handle single URL string
      if (typeof data === "string" && data.startsWith("http")) {
        return [{ imageUrl: data }];
      }

      throw new Error("Invalid response format from n8n webhook");
    } catch (error: any) {
      const is404 = error.response?.status === 404;
      const data = error.response?.data;
      const isTestModeError =
        typeof data === "string" && data.includes("No workspace here");

      if (is404 || isTestModeError) {
        console.error(
          "[N8NImageProvider] 404 Error: The n8n webhook returned 404. " +
            (webhookUrl.includes("webhook-test")
              ? "This usually means the n8n workflow is not in 'Test' mode. Please click 'Test Workflow' in n8n and try again."
              : "Please check if the webhook URL is correct and the workflow is active."),
        );
      }

      console.error(
        "[N8NImageProvider] n8n webhook request failed:",
        data || error.message,
      );
      throw new Error(
        `n8n generation failed: ${error.message}${isTestModeError ? " (Possible n8n test mode timeout)" : ""}`,
      );
    }
  }

  getProviderName(): string {
    return AI_PROVIDERS.N8N;
  }
}
