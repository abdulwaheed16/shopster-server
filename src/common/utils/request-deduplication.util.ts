import crypto from "crypto";

/**
 * Simple in-memory cache for request deduplication.
 * In a multi-node environment, this should use Redis.
 */
class RequestDeduplicator {
  private cache: Map<string, number> = new Map();
  private readonly DEFAULT_TTL = 5000; // 5 seconds

  /**
   * Generates a unique hash for a request payload.
   */
  generateKey(userId: string, payload: any): string {
    const data = JSON.stringify({
      userId,
      productId: payload.productId,
      uploadedProductId: payload.uploadedProductId,
      templateId: payload.templateId,
      userPrompt: payload.userPrompt || payload.thoughts,
      aspectRatio: payload.aspectRatio,
      variantsCount: payload.variantsCount,
      mediaType: payload.mediaType,
    });

    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Checks if a request is already being processed.
   * If not, it marks it as "in-progress".
   * Returns true if it's a duplicate.
   */
  isDuplicate(key: string, ttl: number = this.DEFAULT_TTL): boolean {
    const now = Date.now();
    const expiry = this.cache.get(key);

    if (expiry && expiry > now) {
      return true;
    }

    this.cache.set(key, now + ttl);

    // Cleanup old keys occasionally
    if (this.cache.size > 1000) {
      this.cleanup();
    }

    return false;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, expiry] of this.cache.entries()) {
      if (expiry <= now) {
        this.cache.delete(key);
      }
    }
  }
}

export const requestDeduplicator = new RequestDeduplicator();
