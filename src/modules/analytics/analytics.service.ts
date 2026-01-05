import { prisma } from "../../config/database.config";
import { AnalyticsQuery } from "./analytics.validation";

import { IAnalyticsService } from "./analytics.types";

export class AnalyticsService implements IAnalyticsService {
  // Get ad analytics
  async getAdAnalytics(userId: string, query: AnalyticsQuery) {
    const where: any = { userId };

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [totalAds, completedAds, failedAds, pendingAds, processingAds] =
      await Promise.all([
        prisma.ad.count({ where }),
        prisma.ad.count({ where: { ...where, status: "COMPLETED" } }),
        prisma.ad.count({ where: { ...where, status: "FAILED" } }),
        prisma.ad.count({ where: { ...where, status: "PENDING" } }),
        prisma.ad.count({ where: { ...where, status: "PROCESSING" } }),
      ]);

    const successRate =
      totalAds > 0 ? ((completedAds / totalAds) * 100).toFixed(2) : 0;

    return {
      total: totalAds,
      completed: completedAds,
      failed: failedAds,
      pending: pendingAds,
      processing: processingAds,
      successRate: parseFloat(successRate as string),
      byStatus: {
        COMPLETED: completedAds,
        FAILED: failedAds,
        PENDING: pendingAds,
        PROCESSING: processingAds,
      },
    };
  }

  // Get store analytics
  async getStoreAnalytics(userId: string, query: AnalyticsQuery) {
    const stores = await prisma.store.findMany({
      where: { userId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const totalProducts = stores.reduce((sum, s) => sum + s._count.products, 0);

    return {
      totalStores: stores.length,
      activeStores: stores.filter((s) => s.isActive).length,
      inactiveStores: stores.filter((s) => !s.isActive).length,
      totalProducts,
      syncStatus: {
        completed: stores.filter((s) => s.syncStatus === "COMPLETED").length,
        syncing: stores.filter((s) => s.syncStatus === "SYNCING").length,
        pending: stores.filter((s) => s.syncStatus === "PENDING").length,
        failed: stores.filter((s) => s.syncStatus === "FAILED").length,
      },
      stores: stores.map((s) => ({
        id: s.id,
        name: s.name,
        platform: s.platform,
        productCount: s._count.products,
        syncStatus: s.syncStatus,
        lastSyncAt: s.lastSyncAt,
        isActive: s.isActive,
      })),
    };
  }

  // Get product analytics
  async getProductAnalytics(userId: string, query: AnalyticsQuery) {
    const where: any = {
      store: { userId },
    };

    if (query.storeId) {
      where.storeId = query.storeId;
    }

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        isActive: true,
        inStock: true,
        productSource: true,
      },
    });

    return {
      total: products.length,
      active: products.filter((p) => p.isActive).length,
      inactive: products.filter((p) => !p.isActive).length,
      inStock: products.filter((p) => p.inStock).length,
      outOfStock: products.filter((p) => !p.inStock).length,
      bySource: {
        store: products.filter((p) => p.productSource === "STORE").length,
        uploaded: products.filter((p) => p.productSource === "UPLOADED").length,
      },
    };
  }
}

export const analyticsService = new AnalyticsService();
