import { AdStatus } from "@prisma/client";
import { prisma } from "../../config/database.config";

import { IDashboardService } from "./dashboard.types";

export class DashboardService implements IDashboardService {
  // Get user dashboard stats
  async getUserStats(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      storesCount,
      productsCount,
      templatesCount,
      adsStats,
      todayAdsCount,
      recentAds,
      user,
      adsTrend,
    ] = await Promise.all([
      // Total stores
      prisma.store.count({ where: { userId } }),

      // Total products (both synced and uploaded)
      prisma.product.count({
        where: {
          OR: [{ userId }, { store: { userId } }],
        },
      }),

      // Total templates
      prisma.template.count({ where: { userId } }),

      // Ads stats by status
      prisma.ad.groupBy({
        by: ["status"],
        where: { userId },
        _count: true,
      }),

      // Today's ads
      prisma.ad.count({
        where: {
          userId,
          createdAt: { gte: today },
        },
      }),

      // Recent ads
      prisma.ad.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          template: {
            select: {
              name: true,
            },
          },
        },
      }),
      // User credits and subscription
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          creditWallet: { select: { balance: true } },
          subscription: {
            include: {
              plan: true,
            },
          },
        },
      }),
      // Last 7 days trend
      this.getTrendData(prisma.ad, { userId }, 7),
    ]);

    // Transform ads stats
    const adsStatusCounts = {
      total: 0,
      today: todayAdsCount,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    adsStats.forEach((stat: { status: AdStatus; _count: number }) => {
      adsStatusCounts.total += stat._count;
      adsStatusCounts[
        stat.status.toLowerCase() as keyof typeof adsStatusCounts
      ] = stat._count;
    });

    // Resolve products for recent ads
    const recentAdsWithProducts = await Promise.all(
      recentAds?.map(async (ad: any) => {
        const products =
          ad.productIds && ad.productIds.length > 0
            ? await prisma.product.findMany({
                where: { id: { in: ad.productIds } },
                select: { title: true, images: true },
              })
            : [];
        return { ...ad, products };
      }),
    );

    return {
      stores: storesCount,
      products: productsCount,
      templates: templatesCount,
      ads: adsStatusCounts,
      recentAds: recentAdsWithProducts,
      credits: user?.creditWallet?.balance || 0,
      subscription: user?.subscription,
      trends: {
        ads: adsTrend,
      },
    };
  }

  // Get admin dashboard stats
  async getAdminStats(days: number = 30) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      usersStats,
      todayUsersCount,
      storesCount,
      adsStats,
      todayAdsCount,
      ownAdsCount,
      recentUsers,
      latestExecutions,
      usersTrend,
      adsTrend,
    ] = await Promise.all([
      // Granular users stats
      prisma.user.groupBy({
        by: ["role", "isActive"],
        _count: true,
      }),

      // Today's joined users
      prisma.user.count({
        where: {
          createdAt: { gte: today },
        },
      }),

      // Total stores
      prisma.store.count(),

      // Ads stats by status
      prisma.ad.groupBy({
        by: ["status"],
        _count: true,
      }),

      // Today's total ads
      prisma.ad.count({
        where: {
          createdAt: { gte: today },
        },
      }),

      // Admin's own ads (where user role is ADMIN)
      prisma.ad.count({
        where: {
          user: { role: "ADMIN" },
        },
      }),

      // Recent users
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),

      // Latest executions (Success/Failed ads for Audit Log)
      prisma.ad.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          template: {
            select: {
              name: true,
            },
          },
        },
      }),

      // Trending data
      this.getTrendData(prisma.user, {}, days),
      this.getTrendData(prisma.ad, {}, days),
    ]);

    // Transform ads stats
    const adsStatusCounts = {
      total: 0,
      today: todayAdsCount,
      own: ownAdsCount,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    adsStats.forEach((stat: { status: AdStatus; _count: number }) => {
      adsStatusCounts.total += stat._count;
      adsStatusCounts[
        stat.status.toLowerCase() as keyof typeof adsStatusCounts
      ] = stat._count;
    });

    // Transform users stats
    const usersSummary = {
      total: 0,
      today: todayUsersCount,
      active: 0,
      inactive: 0,
      admins: 0,
    };

    usersStats.forEach(
      (stat: { role: string; isActive: boolean; _count: number }) => {
        usersSummary.total += stat._count;
        if (stat.isActive) usersSummary.active += stat._count;
        else usersSummary.inactive += stat._count;
        if (stat.role === "ADMIN") usersSummary.admins += stat._count;
      },
    );

    return {
      users: usersSummary,
      stores: storesCount,
      ads: adsStatusCounts,
      recentUsers,
      latestExecutions,
      trends: {
        users: usersTrend,
        ads: adsTrend,
      },
    };
  }

  // Helper to get trend data for charts
  private async getTrendData(model: any, where: any, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const data = await model.findMany({
      where: {
        ...where,
        createdAt: { gte: startDate },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    // Group by date
    const countsByDate: Record<string, number> = {};

    // Initialize all dates with 0
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      countsByDate[dateStr] = 0;
    }

    data.forEach((item: any) => {
      const dateStr = new Date(item.createdAt).toISOString().split("T")[0];
      if (countsByDate[dateStr] !== undefined) {
        countsByDate[dateStr]++;
      }
    });

    return Object.entries(countsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

export const dashboardService = new DashboardService();
