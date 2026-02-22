import axios from "axios";
import Logger from "../../../common/logging/logger";
import { config } from "../../../config/env.config";

/**
 * Abstract base class for n8n-backed AI providers.
 *
 * Encapsulates the shared fire-and-forget webhook logic so that
 * N8NImageProvider and N8NVideoProvider stay DRY and only own
 * their payload construction and result mapping.
 */
export abstract class N8NBaseProvider {
  /** Subclasses declare their log prefix, e.g. "[N8NImageProvider]" */
  protected abstract readonly logPrefix: string;

  /**
   * Builds the callback URL from SERVER_BASE_URL config.
   * Returns undefined if not configured (n8n cannot send results back).
   */
  protected buildCallbackUrl(): string | undefined {
    const base = config.webhook.serverBaseUrl;
    if (!base) return undefined;

    const url = new URL("/api/v1/ads/n8n-callback", base);

    // Append the shared secret so n8n can include it automatically
    // in the `x-n8n-secret` header. We pass it both as a query param
    // (for inspection) and n8n is expected to forward it as a header.

    const secret = config.webhook.n8nCallbackSecret;
    if (secret) {
      url.searchParams.set("secret", secret);
    }

    return url.toString();
  }

  /**
   * Validates that the n8n webhook URL is configured.
   * Throws if missing so callers get a clear error early.
   */
  protected resolveWebhookUrl(): string {
    const url = config.webhook.n8nUrl;
    if (!url) {
      throw new Error("n8n Webhook URL is not configured (N8N_WEBHOOK_URL)");
    }
    return url;
  }

  /**
   * Fires a POST request to the n8n webhook and returns immediately
   * after acknowledgement (fire-and-forget pattern).
   *
   * n8n is expected to respond quickly with { status: "ACCEPTED" }
   * and then POST the real result to our callback endpoint when done.
   *
   * @param webhookUrl - The n8n webhook endpoint
   * @param payload    - The request body to send
   */
  protected async fireAndForget(
    webhookUrl: string,
    payload: object,
  ): Promise<void> {
    const callbackUrl = this.buildCallbackUrl();

    Logger.info(
      `${this.logPrefix} Sending fire-and-forget request to n8n: ${webhookUrl}`,
    );
    Logger.info(
      `${this.logPrefix} Callback URL: ${callbackUrl ?? "NOT SET — n8n cannot send results back!"}`,
    );

    Logger.info(`${this.logPrefix} Ad Generation Request Payload:`, payload);

    try {
      const response = await axios.post(
        webhookUrl,
        { ...payload, callbackUrl },
        {
          timeout: 50_000,
        },
      );

      Logger.info(`${this.logPrefix} n8n acknowledged:`, response.data);
    } catch (error: any) {
      this.handleWebhookError(error, webhookUrl);
    }
  }

  /**
   * Normalises webhook errors into a single thrown Error with a
   * developer-friendly message, including hints for the common
   * "workflow not in Test mode" 404 case.
   */
  private handleWebhookError(error: any, webhookUrl: string): never {
    const responseData = error.response?.data;
    const is404 = error.response?.status === 404;
    const isTestModeError =
      typeof responseData === "string" &&
      responseData.includes("No workspace here");

    if (is404 || isTestModeError) {
      const hint = webhookUrl.includes("webhook-test")
        ? "This usually means the n8n workflow is not in 'Test' mode. " +
          "Please click 'Test Workflow' in n8n and try again."
        : "Please check that the webhook URL is correct and the workflow is active.";

      Logger.error(
        `${this.logPrefix} 404 Error: The n8n webhook returned 404. ${hint}`,
      );
    }

    Logger.error(
      `${this.logPrefix} n8n webhook request failed:`,
      responseData ?? error.message,
    );

    throw new Error(
      `n8n webhook request failed: ${error.message}` +
        (isTestModeError ? " (Possible n8n test mode timeout)" : ""),
    );
  }
}
