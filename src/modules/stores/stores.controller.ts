import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { MESSAGES } from "../../common/constants/messages.constant";
import Logger from "../../common/logging/logger";
import {
  sendCreated,
  sendPaginated,
  sendSuccess,
} from "../../common/utils/response.util";
import { prisma } from "../../config/database.config";
import { config } from "../../config/env.config";
import { storeProductsService } from "../products/services/store-products.service";
import { shopifyService } from "./shopify.service";
import { storesService } from "./stores.service";
import {
  CreateStoreBody,
  GetStoresQuery,
  ShopifyAuthQuery,
  ShopifyCallbackQuery,
  UpdateStoreBody,
} from "./stores.validation";

export class StoresController {
  async initiateShopifyAuth(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { shop } = req.query as unknown as ShopifyAuthQuery;

      // Generate stateless signed state
      const stateData = {
        userId: req.user!.id,
        nonce: crypto.randomBytes(16).toString("hex"),
        timestamp: Date.now(),
      };

      const state = this.signState(stateData);

      // Still set cookies as fallback, but don't rely on them
      const cookieOptions = {
        signed: true,
        httpOnly: true,
        secure: true,
        sameSite: "none" as const,
        maxAge: 10 * 60 * 1000,
      };

      res.cookie("shopify_state", stateData.nonce, cookieOptions);
      res.cookie("shopify_user_id", req.user!.id, cookieOptions);

      const authUrl = shopifyService.generateAuthUrl(shop, state);
      Logger.info(`Shopify Auth URL generated for shop: ${shop}`);

      sendSuccess(res, MESSAGES.STORES.AUTH_INITIATED, { url: authUrl });
    } catch (error) {
      next(error);
    }
  }

  async shopifyAuthCallback(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = req.query as unknown as ShopifyCallbackQuery;
      const { shop, code, state } = query;

      // 1. Verify signed state (Stateless)
      const decodedState = this.verifyState(state);

      let userId: string | undefined;

      if (decodedState) {
        userId = (decodedState as any).userId;
        // Check if state is older than 10 minutes
        if (Date.now() - (decodedState as any).timestamp > 10 * 60 * 1000) {
          throw new Error("OAuth state expired.");
        }
      } else {
        // Fallback to cookies for backward compatibility or edge cases
        const storedState = req.signedCookies.shopify_state;
        const cookieUserId = req.signedCookies.shopify_user_id;

        // If state is not signed, it might be the nonce from the cookie
        if (storedState && state === storedState && cookieUserId) {
          userId = cookieUserId;
        }
      }

      if (!userId) {
        throw new Error("Invalid OAuth state or session expired.");
      }

      res.clearCookie("shopify_state");
      res.clearCookie("shopify_user_id");

      // 2. Verify HMAC
      if (!shopifyService.verifyHmac(query as any)) {
        throw new Error("Invalid HMAC signature from Shopify.");
      }

      // 3. Exchange code for permanent access token
      const accessToken = await shopifyService.exchangeCodeForToken(shop, code);

      // 4. Upsert store in database
      const store = await storesService.upsertStoreByShopifyDomain(userId, {
        name: shop.split(".")[0],
        storeUrl: `https://${shop}`,
        shopifyDomain: shop,
        accessToken,
      });

      // 5. Register webhooks for product updates
      await shopifyService.registerWebhooks(shop, accessToken);

      // 6. Trigger initial background sync
      await storesService.syncStore(store.id, userId);

      // Redirect back to frontend with success
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      res.redirect(`${frontendUrl}/stores?status=success&storeId=${store.id}`);
    } catch (error) {
      Logger.error("Shopify callback error:", error);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      res.redirect(
        `${frontendUrl}/stores?status=error&message=Authentication failed`,
      );
    }
  }

  async handleShopifyWebhook(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const topic = req.headers["x-shopify-topic"] as string;
      const shop = req.headers["x-shopify-shop-domain"] as string;
      const hmacHeader = req.headers["x-shopify-hmac-sha256"] as string;
      const data = req.body;

      // 1. Verify HMAC
      const rawBody = (req as any).rawBody;
      if (!shopifyService.verifyWebhookHmac(rawBody, hmacHeader)) {
        Logger.warn(
          `🛑 Invalid HMAC for Shopify webhook: ${topic} from ${shop}`,
        );
        res.status(401).send("Invalid HMAC");
        return;
      }

      Logger.info(`📦 Received Shopify webhook: ${topic} from ${shop}`);

      // 2. Get store details
      const store = await prisma.store.findFirst({
        where: { shopifyDomain: shop },
        include: { user: true },
      });

      if (!store) {
        Logger.warn(`Webhook received for unknown shop: ${shop}`);
        res.status(200).send(); // Always return 200 to Shopify
        return;
      }

      // 2. Process based on topic
      if (topic === "products/update" || topic === "products/create") {
        // Trigger a specific sync for this product or re-trigger full sync
        // For simplicity, we can just trigger a full sync background job
        await storesService.syncStore(store.id, store.userId);
      } else if (topic === "products/delete") {
        const externalId = data.id.toString();
        await prisma.product.deleteMany({
          where: {
            storeId: store.id,
            externalId,
          },
        });
        Logger.info(`🗑️ Deleted product ${externalId} from store ${store.id}`);
      }

      res.status(200).send();
    } catch (error) {
      Logger.error("Webhook processing error:", error);
      res.status(200).send(); // Always return 200 to Shopify to avoid retries on our processing errors
    }
  }

  async getStores(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const query: GetStoresQuery = req.query as any;

      const result = await storesService.getStores(userId, query);

      sendPaginated(res, MESSAGES.STORES.FETCHED, result);
    } catch (error) {
      next(error);
    }
  }

  async getStoreById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const store = await storesService.getStoreById(id as string, userId);

      sendSuccess(res, MESSAGES.STORES.FETCHED_ONE, store);
    } catch (error) {
      next(error);
    }
  }

  async createStore(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: CreateStoreBody = req.body;

      const store = await storesService.createStore(userId, data);

      sendCreated(res, MESSAGES.STORES.CREATED, store);
    } catch (error) {
      next(error);
    }
  }

  async updateStore(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const data: UpdateStoreBody = req.body;

      const store = await storesService.updateStore(id as string, userId, data);

      sendSuccess(res, MESSAGES.STORES.UPDATED, store);
    } catch (error) {
      next(error);
    }
  }

  async deleteStore(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await storesService.deleteStore(id as string, userId);

      sendSuccess(res, MESSAGES.STORES.DELETED);
    } catch (error) {
      next(error);
    }
  }

  async syncStore(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const result = await storesService.syncStore(id as string, userId);

      sendSuccess(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  async syncProductsManually(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      // 1. Get store and verify ownership
      const store = await storesService.getStoreById(id as string, userId);

      if (!store.shopifyDomain || !store.accessToken) {
        throw new Error("Store is not properly configured for Shopify");
      }

      // 2. Update sync status
      await prisma.store.update({
        where: { id: id as string },
        data: { syncStatus: "SYNCING", lastSyncAt: new Date() },
      });

      Logger.info(`🔄 Manually syncing products for store ${id}`);

      // 3. Fetch products from Shopify
      const shopifyProducts = await shopifyService.fetchProducts(
        store.shopifyDomain,
        store.accessToken,
      );

      Logger.info(`📦 Fetched ${shopifyProducts.length} products from Shopify`);

      // 4. Map and save products
      const productsToSync = shopifyProducts.map((sp: any) => ({
        storeId: id as string,
        categoryIds: sp.categoryIds || [],
        externalId: sp.id.toString(),
        productSource: "STORE" as const,
        sourceMetadata: {
          shopifyProductId: sp.id,
          shopifyVariantIds: sp.variants.map((v: any) => v.id),
        },
        sku: sp.variants[0]?.sku || null,
        productType: sp.product_type,
        title: sp.title,
        description: sp.body_html || null,
        isActive: sp.status === "active",
        inStock: sp.variants.some(
          (v: any) =>
            v.inventory_quantity > 0 || v.inventory_policy === "continue",
        ),
        images: sp.images.map((img: any) => ({
          url: img.src,
          alt: sp.title,
          position: img.position,
        })),
        variants: sp.variants.map((v: any) => ({
          id: v.id.toString(),
          title: v.title,
          sku: v.sku || null,
          inStock:
            v.inventory_quantity > 0 || v.inventory_policy === "continue",
          options: {},
        })),
      }));

      const result = await storeProductsService.bulkCreateProducts(
        userId,
        productsToSync,
      );

      // 5. Update sync status to COMPLETED
      await prisma.store.update({
        where: { id: id as string },
        data: { syncStatus: "COMPLETED" },
      });

      Logger.info(`✅ Successfully synced ${result.count} new products`);

      // 6. Fetch and return products from database
      const products = await storeProductsService.getProducts(userId, {
        source: "STORE",
        storeId: id as string,
        page: "1",
        limit: "100",
      });

      sendSuccess(res, `Synced ${result.count} new products`, {
        syncResult: result,
        products: products.data,
        meta: products.meta,
      });
    } catch (error) {
      Logger.error("Manual sync error:", error);
      // Update sync status to FAILED
      try {
        await prisma.store.update({
          where: { id: req.params.id as string },
          data: { syncStatus: "FAILED" },
        });
      } catch (updateError) {
        Logger.error("Failed to update sync status:", updateError);
      }
      next(error);
    }
  }
  async getStoreCategories(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const categories = await storesService.getStoreCategories(
        id as string,
        userId,
      );

      sendSuccess(res, MESSAGES.CATEGORIES.FETCHED, categories);
    } catch (error) {
      next(error);
    }
  }

  // Helper to sign state for stateless OAuth
  private signState(data: unknown): string {
    const payload = Buffer.from(JSON.stringify(data)).toString("base64");
    const signature = crypto
      .createHmac("sha256", config.server.cookieSecret)
      .update(payload)
      .digest("hex");
    return `${payload}.${signature}`;
  }

  // Helper to verify signed state
  private verifyState(state: string): unknown {
    try {
      if (!state || !state.includes(".")) return null;

      const [payload, signature] = state.split(".");
      if (!payload || !signature) return null;

      const expectedSignature = crypto
        .createHmac("sha256", config.server.cookieSecret)
        .update(payload)
        .digest("hex");

      if (signature !== expectedSignature) return null;

      return JSON.parse(Buffer.from(payload, "base64").toString());
    } catch (error) {
      return null;
    }
  }
}

export const storesController = new StoresController();
