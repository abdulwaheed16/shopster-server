import { ApiError } from "../../common/errors/api-error";
import { prisma } from "../../config/database.config";
import { shopifySyncQueue } from "../../config/queue.config";
import {
  CreateStoreBody,
  GetStoresQuery,
  UpdateStoreBody,
} from "./stores.validation";

import { Prisma, StorePlatform } from "@prisma/client";
import { calculatePagination } from "../../common/utils/pagination.util";
import { IStoresService } from "./stores.types";

export class StoresService implements IStoresService {
  // Get user's stores
  async getStores(userId: string, query: GetStoresQuery) {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const skip = (page - 1) * limit;

    const where: Prisma.StoreWhereInput = { userId };

    // TODO: Add search functionality
    // if (query.search) {
    //   where.name = { contains: query.search, mode: "insensitive" };
    // }

    if (query.platform) {
      where.platform = query.platform as StorePlatform;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive === "true";
    }

    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { products: true },
          },
        },
      }),
      prisma.store.count({ where }),
    ]);

    return {
      data: stores,
      meta: calculatePagination(total, page, limit),
    };
  }

  // Get store by ID
  async getStoreById(id: string, userId: string) {
    const store = await prisma.store.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!store) {
      throw ApiError.notFound("Store not found or you don't have access");
    }

    return store;
  }

  // Create store manually
  async createStore(userId: string, data: CreateStoreBody) {
    // Check stores limit
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: {
          include: { plan: true },
        },
        _count: { select: { stores: true } },
      },
    });

    if (!user) throw ApiError.notFound("User not found");

    const storesLimit = user.subscription?.plan?.storesLimit || 1; // Default to 1 if no plan

    if (user._count.stores >= storesLimit) {
      throw ApiError.badRequest(
        `Store limit reached (${storesLimit}). Please upgrade your plan.`,
      );
    }

    const store = await prisma.store.create({
      data: {
        ...data,
        userId,
      },
    });

    return store;
  }

  // Update store
  async updateStore(id: string, userId: string, data: UpdateStoreBody) {
    await this.getStoreById(id, userId);

    return await prisma.store.update({
      where: { id },
      data,
    });
  }

  // Delete store
  async deleteStore(id: string, userId: string) {
    await this.getStoreById(id, userId);

    await prisma.store.delete({
      where: { id },
    });
  }

  // For internal use
  async findByShopifyDomain(shopifyDomain: string) {
    return await prisma.store.findFirst({
      where: { shopifyDomain },
    });
  }

  async upsertStoreByShopifyDomain(
    userId: string,
    data: {
      name: string;
      storeUrl: string;
      shopifyDomain: string;
      accessToken: string;
    },
  ) {
    // Check if store already connected
    const existing = await this.findByShopifyDomain(data.shopifyDomain);

    if (existing) {
      // Update existing store tokens if it belongs to user
      if (existing.userId === userId) {
        return await prisma.store.update({
          where: { id: existing.id },
          data: {
            accessToken: data.accessToken,
            isActive: true,
          },
        });
      }
      throw ApiError.badRequest("Store already connected by another user");
    }

    // Check limits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: {
          include: { plan: true },
        },
        _count: { select: { stores: true } },
      },
    });

    if (!user) throw ApiError.notFound("User not found");

    const storesLimit = user.subscription?.plan?.storesLimit ?? 1;

    if (user._count.stores >= storesLimit) {
      throw ApiError.badRequest(
        `Store limit reached (${storesLimit}). Please upgrade your plan.`,
      );
    }

    return await prisma.store.create({
      data: {
        ...data,
        userId,
        platform: StorePlatform.SHOPIFY,
        isActive: true,
        syncStatus: "PENDING",
      },
    });
  }

  async updateSyncStatus(
    id: string,
    status: "PENDING" | "SYNCING" | "COMPLETED" | "FAILED",
    lastSyncAt?: Date,
  ) {
    return await prisma.store.update({
      where: { id },
      data: {
        syncStatus: status,
        ...(lastSyncAt && { lastSyncAt }),
      },
    });
  }

  // Sync store products in background
  async syncStore(id: string, userId: string) {
    const store = await this.getStoreById(id, userId);

    // Update sync status
    await prisma.store.update({
      where: { id },
      data: { syncStatus: "PENDING" },
    });

    // Add to Redis Queue
    await shopifySyncQueue.add(
      "sync-products",
      {
        storeId: id,
        userId,
        shop: store.shopifyDomain,
        accessToken: store.accessToken,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
      },
    );

    return { message: "Sync job successfully queued" };
  }

  // Get unique product types from store products
  async getStoreCategories(id: string, userId: string) {
    // 1. Verify store exists and belongs to user
    await this.getStoreById(id, userId);

    // 2. Get unique product types
    // Since we are using MongoDB, Prisma's distinct might have limitations
    // but findMany with distinct or groupBy should work.
    const products = await prisma.product.findMany({
      where: { storeId: id, productSource: "STORE" },
      select: { productType: true },
      distinct: ["productType"],
    });

    // 3. Map to consistent Category-like format
    return products
      .map((p) => p.productType)
      .filter((type): type is string => !!type)
      .map((type) => ({
        id: type, // Using the type name as the ID for store categories
        name: type,
        slug: type.toLowerCase().replace(/\s+/g, "-"),
      }));
  }
}

export const storesService = new StoresService();
