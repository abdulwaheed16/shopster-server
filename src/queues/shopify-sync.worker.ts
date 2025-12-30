import { Job, Worker } from "bullmq";
import { prisma } from "../config/database.config";
import { connection, QUEUE_NAMES } from "../config/queue.config";
import { productsService } from "../modules/products/products.service";
import { shopifyService } from "../modules/stores/shopify.service";
import { ProductSource } from "@prisma/client";

// Shopify Sync Job Data
export interface ShopifySyncJobData {
  storeId: string;
  userId: string;
}

// Create worker for Shopify sync
export const shopifySyncWorker = new Worker(
  QUEUE_NAMES.SHOPIFY_SYNC,
  async (job: Job<ShopifySyncJobData>) => {
    const { storeId, userId } = job.data;

    console.log(
      `🔄 Processing Shopify sync job ${job.id} for store ${storeId}`
    );

    try {
      // 1. Get store details
      const store = await prisma.store.findUnique({
        where: { id: storeId },
      });

      if (!store || !store.accessToken || !store.shopifyDomain) {
        throw new Error(
          `Store ${storeId} not found or missing Shopify credentials`
        );
      }

      // 2. Update store status to SYNCING
      await prisma.store.update({
        where: { id: storeId },
        data: { syncStatus: "SYNCING", lastSyncAt: new Date() },
      });

      // 3. Fetch products from Shopify
      const shopifyProducts = await shopifyService.fetchProducts(
        store.shopifyDomain,
        store.accessToken
      );

      // 4. Map Shopify products to our Product model
      const productsToSync = shopifyProducts.map((sp: any) => ({
        storeId,
        externalId: sp.id.toString(),
        productSource: ProductSource.STORE,
        sourceMetadata: {
          shopifyProductId: sp.id,
          shopifyVariantIds: sp.variants.map((v: any) => v.id),
        },
        sku: sp.variants[0]?.sku || null,
        title: sp.title,
        description: sp.body_html || null,
        isActive: sp.status === "active",
        inStock: sp.variants.some(
          (v: any) =>
            v.inventory_quantity > 0 || v.inventory_policy === "continue"
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
          options: {}, // Simplified
        })),
      }));

      // 5. Bulk create products (handling duplicates internally)
      const result = await productsService.bulkCreateProducts(
        userId,
        productsToSync
      );

      // 6. Update store status to COMPLETED
      await prisma.store.update({
        where: { id: storeId },
        data: { syncStatus: "COMPLETED" },
      });

      console.log(
        `✅ Shopify sync completed for store ${storeId}: ${result.message}`
      );
      return { success: true, storeId, ...result };
    } catch (error: any) {
      console.error(
        `❌ Shopify sync failed for store ${storeId}:`,
        error.message
      );

      // Update store status to FAILED
      await prisma.store.update({
        where: { id: storeId },
        data: {
          syncStatus: "FAILED",
          metadata: {
            error: error.message,
            failedAt: new Date().toISOString(),
          },
        },
      });

      throw error;
    }
  },
  {
    connection,
    concurrency: 2,
  }
);

// Worker event listeners
shopifySyncWorker.on("completed", (job) => {
  console.log(`✅ Shopify Sync Job ${job.id} completed successfully`);
});

shopifySyncWorker.on("failed", (job, err) => {
  console.error(`❌ Shopify Sync Job ${job?.id} failed:`, err.message);
});
