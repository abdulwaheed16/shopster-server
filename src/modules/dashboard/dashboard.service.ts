import { AdStatus, JobStatus } from "@prisma/client";
import { prisma } from "../../config/database.config";

import { IDashboardService } from "./dashboard.types";

export class DashboardService implements IDashboardService {
  // Get user dashboard stats
  async getUserStats(userId: string) {
    const [
      storesCount,
      productsCount,
      templatesCount,
      variablesCount,
      adsStats,
      recentAds,
      user,
    ] = await Promise.all([
      // Total stores
      prisma.store.count({ where: { userId } }),

      // Total products
      prisma.product.count({
        where: { store: { userId } }, 
      }),

      // Total templates
      prisma.template.count({ where: { userId } }),

      // Total variables
      prisma.variable.count({ where: { userId } }),

      // Ads stats by status
      prisma.ad.groupBy({
        by: ["status"],
        where: { userId },
        _count: true,
      }),

      // Recent ads
      prisma.ad.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            select: {
              title: true,
              images: true,
            },
          },
          template: {
            select: {
              name: true,
            },
          },
        },
      }),
      // User credits
      prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      }),
    ]);

    // Transform ads stats
    const adsStatusCounts = {
      total: 0,
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

    return {
      stores: storesCount,
      products: productsCount,
      templates: templatesCount,
      variables: variablesCount,
      ads: adsStatusCounts,
      recentAds,
      credits: user?.credits || 0,
    };
  }

  // Get admin dashboard stats
  async getAdminStats() {
    const [
      usersCount,
      storesCount,
      productsCount,
      templatesCount,
      adsStats,
      jobsStats,
      recentUsers,
      recentAds,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Total stores
      prisma.store.count(),

      // Total products
      prisma.product.count(),

      // Total templates
      prisma.template.count(),

      // Ads stats by status
      prisma.ad.groupBy({
        by: ["status"],
        _count: true,
      }),

      // Jobs stats by status
      prisma.generationJob.groupBy({
        by: ["status"],
        _count: true,
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

      // Recent ads
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
          product: {
            select: {
              title: true,
            },
          },
        },
      }),
    ]);

    // Transform ads stats
    const adsStatusCounts = {
      total: 0,
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

    // Transform jobs stats
    const jobsStatusCounts = {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    jobsStats.forEach((stat: { status: JobStatus; _count: number }) => {
      jobsStatusCounts.total += stat._count;
      jobsStatusCounts[
        stat.status.toLowerCase() as keyof typeof jobsStatusCounts
      ] = stat._count;
    });

    return {
      users: usersCount,
      stores: storesCount,
      products: productsCount,
      templates: templatesCount,
      ads: adsStatusCounts,
      jobs: jobsStatusCounts,
      recentUsers,
      recentAds,
    };
  }
}

export const dashboardService = new DashboardService();
