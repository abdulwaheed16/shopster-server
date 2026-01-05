import axios from "axios";
import crypto from "crypto";
import { ApiError } from "../../common/errors/api-error";
import { config } from "../../config/env.config";

import { IShopifyService } from "./stores.types";

export class ShopifyService implements IShopifyService {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly scopes: string;
  private readonly callbackUrl: string;

  constructor() {
    this.apiKey = config.shopify.apiKey || "";
    this.apiSecret = config.shopify.apiSecret || "";
    this.scopes = config.shopify.scopes || "read_products";
    this.callbackUrl = config.shopify.callbackUrl || "";

    if (!this.apiKey || !this.apiSecret || !this.callbackUrl) {
      console.warn(
        "Shopify API credentials are not fully configured in environment variables."
      );
    }
  }

  // Generate the Shopify OAuth URL
  generateAuthUrl(shop: string, state: string) {
    // Sanitize shop domain
    const sanitizedShop = this.sanitizeShopDomain(shop);

    return `https://${sanitizedShop}/admin/oauth/authorize?client_id=${this.apiKey}&scope=${this.scopes}&redirect_uri=${this.callbackUrl}&state=${state}`;
  }

  // Verify HMAC from Shopify callback
  verifyHmac(query: Record<string, unknown>): boolean {
    const { hmac, ...params } = query;
    if (!hmac) return false;

    // Sort params alphabetically and join with &
    const message = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&");

    const generatedHmac = crypto
      .createHmac("sha256", this.apiSecret)
      .update(message)
      .digest("hex");

    return generatedHmac === hmac;
  }

  // Exchange authorization code for permanent access token
  async exchangeCodeForToken(shop: string, code: string) {
    const sanitizedShop = this.sanitizeShopDomain(shop);
    const url = `https://${sanitizedShop}/admin/oauth/access_token`;

    try {
      const response = await axios.post(url, {
        client_id: this.apiKey,
        client_secret: this.apiSecret,
        code,
      });

      return response.data.access_token;
      // @ts-ignore
    } catch (error: any) {
      console.error(
        "Shopify token exchange error:",
        error.response?.data || error.message
      );
      throw ApiError.badRequest(
        "Failed to exchange Shopify authorization code for access token"
      );
    }
  }

  // Fetch products from Shopify
  async fetchProducts(shop: string, accessToken: string, limit = 50) {
    const sanitizedShop = this.sanitizeShopDomain(shop);
    const url = `https://${sanitizedShop}/admin/api/2024-01/products.json?limit=${limit}`;

    try {
      const response = await axios.get(url, {
        headers: {
          "X-Shopify-Access-Token": accessToken,
        },
      });

      return response.data.products as unknown[];
      // @ts-ignore
    } catch (error: any) {
      console.error(
        "Shopify fetch products error:",
        error.response?.data || error.message
      );
      throw ApiError.badRequest("Failed to fetch products from Shopify");
    }
  }

  // Register webhooks with Shopify
  async registerWebhooks(shop: string, accessToken: string) {
    const sanitizedShop = this.sanitizeShopDomain(shop);
    const url = `https://${sanitizedShop}/admin/api/2024-01/webhooks.json`;

    // Derive webhook base from callback URL
    const callbackBase = this.callbackUrl.replace("/shopify/callback", "");
    const webhookAddress = `${callbackBase}/shopify/webhooks`;

    const webhooks = [
      { topic: "products/update", address: webhookAddress, format: "json" },
      { topic: "products/delete", address: webhookAddress, format: "json" },
    ];

    for (const webhook of webhooks) {
      try {
        await axios.post(
          url,
          { webhook },
          {
            headers: {
              "X-Shopify-Access-Token": accessToken,
            },
          }
        );
        console.log(`Registered Shopify webhook: ${webhook.topic}`);
        // @ts-ignore
      } catch (error: any) {
        // Shopify returns 422 if webhook already exists
        if (error.response?.status === 422) {
          console.log(`Webhook already exists: ${webhook.topic}`);
        } else {
          console.error(
            `Failed to register Shopify webhook ${webhook.topic}:`,
            error.response?.data || error.message
          );
        }
      }
    }
  }

  // Verify Shopify Webhook HMAC
  verifyWebhookHmac(rawBody: string, hmacHeader: string) {
    if (!hmacHeader || !rawBody) return false;

    const generatedHmac = crypto
      .createHmac("sha256", this.apiSecret)
      .update(rawBody, "utf8")
      .digest("base64");

    return generatedHmac === hmacHeader;
  }

  // Sanitize shop domain (must end with .myshopify.com)
  private sanitizeShopDomain(shop: string): string {
    let sanitized = shop.trim().toLowerCase();

    // Remove protocol if present
    sanitized = sanitized.replace(/^https?:\/\//, "");

    // Ensure it ends with .myshopify.com
    if (!sanitized.endsWith(".myshopify.com")) {
      sanitized += ".myshopify.com";
    }

    // Basic regex for valid subdomain
    const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
    if (!shopRegex.test(sanitized)) {
      throw ApiError.badRequest("Invalid Shopify shop domain");
    }

    return sanitized;
  }
}

export const shopifyService = new ShopifyService();
