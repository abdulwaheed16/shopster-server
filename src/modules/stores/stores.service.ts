import { ApiError } from "../../common/errors/api-error";
import { PaginatedResult } from "../../common/types/pagination.types";
import { prisma } from "../../config/database.config";
import {
  CreateStoreInput,
  GetStoresQuery,
  UpdateStoreInput,
} from "./stores.validation";
import { shopifySyncQueue } from "../../config/queue.config";

export class StoresService {
  // Get all stores for a user
  async getStores(
    userId: string,
    query: GetStoresQuery
  ): Promise<PaginatedResult<any>> {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "10");
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (query.platform) {
      where.platform = query.platform;
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
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
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
      throw ApiError.notFound("Store not found");
    }

    return store;
  }

  // Helper: Check if user has reached their store limit
  private async checkStoreLimit(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    if (!user) throw ApiError.notFound("User not found");
    if (!user.subscription || !user.subscription.plan) {
      throw ApiError.forbidden("No active subscription found. Please subscribe to add a store.");
    }

    const storeCount = await prisma.store.count({ where: { userId } });
    if (storeCount >= user.subscription.plan.storesLimit) {
      throw ApiError.forbidden(
        `Store limit reached (${user.subscription.plan.storesLimit}). Please upgrade your plan to add more stores.`
      );
    }
  }

  // Create store
  async createStore(userId: string, data: CreateStoreInput) {
    // await this.checkStoreLimit(userId);

    const store = await prisma.store.create({
      data: {
        ...data,
        userId,
        syncStatus: "PENDING",
      },
    });

    return store;
  }

  // Update store
  async updateStore(id: string, userId: string, data: UpdateStoreInput) {
    await this.getStoreById(id, userId); // Check ownership

    const store = await prisma.store.update({
      where: { id },
      data,
    });

    return store;
  }

  // Delete store
  async deleteStore(id: string, userId: string) {
    const store = await this.getStoreById(id, userId);

    // Delete all products first (cascade)
    await prisma.store.delete({
      where: { id },
    });
  }

  // Upsert store by Shopify domain and userId
  async upsertStoreByShopifyDomain(userId: string, data: { 
    name: string; 
    storeUrl: string; 
    shopifyDomain: string; 
    accessToken: string; 
  }) {
    const store = await prisma.store.findFirst({
      where: {
        userId,
        shopifyDomain: data.shopifyDomain,
      },
    });

    if (store) {
      // Update existing store
      return prisma.store.update({
        where: { id: store.id },
        data: {
          accessToken: data.accessToken,
          isActive: true,
        },
      });
    }

    // Checking limit before creation
    // await this.checkStoreLimit(userId);

    // Create new store
    return prisma.store.create({
      data: {
        userId,
        name: data.name,
        storeUrl: data.storeUrl,
        platform: "SHOPIFY",
        shopifyDomain: data.shopifyDomain,
        accessToken: data.accessToken,
        isActive: true,
        syncStatus: "PENDING",
      },
    });
  }

  // Sync store (trigger product sync)
  async syncStore(id: string, userId: string) {
    const store = await this.getStoreById(id, userId);

    // Update sync status
    await prisma.store.update({
      where: { id },
      data: {
        syncStatus: "SYNCING",
        lastSyncAt: new Date(),
      },
    });

    // Add job to BullMQ queue
    await shopifySyncQueue.add(`sync-${id}`, {
      storeId: id,
      userId,
    });

    return { message: "Store sync initiated successfully in the background" };
  }
}

export const storesService = new StoresService();
