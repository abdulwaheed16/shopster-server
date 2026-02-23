import { AdStatus, Prisma } from "@prisma/client";
import { EventEmitter } from "events";
import { ApiError } from "../../common/errors/api-error";
import Logger from "../../common/logging/logger";
import { createPaginatedResponse } from "../../common/utils/pagination.util";
import { prisma } from "../../config/database.config";
import { adGenerationQueue } from "../../config/queue.config";
import { ASPECT_RATIOS } from "../ai/ai.constants";
import { creditsService } from "../billing/credits.service";
import { IAdsService } from "./ads.types";
import { GenerateAdBody, GetAdsQuery } from "./ads.validation";
import { AD_COSTS } from "./constants/ad-costs";

export class AdsService implements IAdsService {
  private adEvents = new EventEmitter();

  // Subscribe to ad updates
  subscribeToAdUpdates(adId: string, callback: (data: any) => void) {
    const handler = (data: any) => {
      if (data.adId === adId) {
        callback(data);
      }
    };
    this.adEvents.on("adUpdate", handler);
    return () => this.adEvents.off("adUpdate", handler);
  }

  // Emit ad update
  emitAdUpdate(adId: string, status: AdStatus, data: any = {}) {
    this.adEvents.emit("adUpdate", { adId, status, ...data });
  }

  // Cancel ad generation
  async cancelAd(adId: string, userId: string): Promise<void> {
    const ad = await prisma.ad.findFirst({
      where: { id: adId, userId },
    });

    if (!ad) {
      throw ApiError.notFound("Ad not found");
    }

    if (ad.status !== "PENDING" && ad.status !== "PROCESSING") {
      throw ApiError.badRequest(`Cannot cancel an ad that is ${ad.status}`);
    }

    // Try to remove from BullMQ (check all potential states)
    try {
      const jobs = await adGenerationQueue.getJobs([
        "waiting",
        "active",
        "delayed",
        "paused",
      ]);
      const job = jobs.find((j) => j.data?.adId === adId);

      if (job) {
        await job.remove();
        Logger.info(`[AdsService] Job for ad ${adId} removed from queue`);
      }
    } catch (queueError: any) {
      Logger.warn(
        `[AdsService] Failed to remove job for ad ${adId} from queue: ${queueError.message}`,
      );
    }

    // Update DB
    await prisma.ad.update({
      where: { id: adId },
      data: { status: "CANCELLED" },
    });

    this.emitAdUpdate(adId, "CANCELLED" as any);
  }

  // Get all ads for a user
  async getAds(userId: string, query: GetAdsQuery, userRole: string) {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const skip = query.cursor ? 1 : (page - 1) * limit; // Skip the cursor itself if present

    const where: Prisma.AdWhereInput = { userId };

    const orderBy: Prisma.AdOrderByWithRelationInput = {
      createdAt: query.sort === "oldest" ? "asc" : "desc",
    };

    if (query.status) {
      where.status = query.status as AdStatus;
    }

    if (query.productId) {
      where.productIds = { has: query.productId };
    }

    if (query.templateId) {
      where.templateId = query.templateId;
    }

    // storeId filter removed (no longer a relation on Ad)

    if (query.search) {
      where.title = {
        contains: query.search,
        mode: "insensitive",
      };
    }

    // Apply strict filtering for non-admins
    if (userRole !== "ADMIN") {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      where.AND = [
        // 1. Never show failed ads
        { status: { not: "FAILED" } },
        // 2. Only show pending/processing if under 15 minutes
        {
          OR: [
            { status: { notIn: ["PENDING", "PROCESSING"] } },
            { createdAt: { gte: fifteenMinutesAgo } },
          ],
        },
      ];
    }

    if (query.days && query.days !== "all") {
      const days = parseInt(query.days);
      const date = new Date();
      date.setDate(date.getDate() - days);
      where.createdAt = {
        gte: date,
      };
    }

    const [ads, total] = await Promise.all([
      prisma.ad.findMany({
        where,
        take: limit,
        skip: query.cursor ? skip : skip,
        cursor: query.cursor ? { id: query.cursor } : undefined,
        orderBy,
        include: {
          template: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.ad.count({ where }),
    ]);

    // Attach product info for all ads via a single bulk query
    const allProductIds = [...new Set(ads.flatMap((a) => a.productIds))];
    const products =
      allProductIds.length > 0
        ? await prisma.product.findMany({
            where: { id: { in: allProductIds } },
            select: { id: true, title: true, images: true },
          })
        : [];
    const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

    // Strip internal fields and attach products
    const sanitizedAds = ads.map((ad: any) => {
      delete ad.resultAnalysis;
      ad.products = ad.productIds
        .map((id: string) => productMap[id])
        .filter(Boolean);
      return ad;
    });

    const nextCursor = ads.length === limit ? ads[ads.length - 1].id : null;

    return createPaginatedResponse(
      sanitizedAds,
      total,
      page,
      limit,
      nextCursor,
    );
  }

  // Get ad by ID
  async getAdById(id: string, userId: string) {
    const ad = await prisma.ad.findFirst({
      where: { id, userId },
      include: { template: true },
    });

    if (!ad) {
      throw ApiError.notFound("Ad not found or you don't have access");
    }

    // Strict filtering for regular users
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      if (ad.status === "FAILED") {
        throw ApiError.notFound("Ad not found or you don't have access");
      }
      if (ad.status === "PENDING" || ad.status === "PROCESSING") {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        if (ad.createdAt < fifteenMinutesAgo) {
          throw ApiError.notFound("Ad not found or you don't have access");
        }
      }
    }

    // Fetch associated products manually (productIds is a plain array, not a Prisma relation)
    const products =
      ad.productIds.length > 0
        ? await prisma.product.findMany({
            where: { id: { in: ad.productIds } },
            select: { id: true, title: true, images: true },
          })
        : [];

    const { resultAnalysis, ...rest } = ad as any;
    return { ...rest, products };
  }

  // Generate ad (Step 3: Submit)
  async generateAd(userId: string, data: GenerateAdBody) {
    // 0. Credit Check (Verify balance before starting)
    const userBalance = await creditsService.getBalance(userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const adCost = AD_COSTS[data.mediaType];

    if (user?.role !== "ADMIN" && userBalance < adCost) {
      throw ApiError.forbidden(
        `Insufficient credits to generate a ${data.mediaType.toLowerCase()} ad. This operation requires ${adCost} credit${adCost > 1 ? "s" : ""}. Please refill your balance.`,
      );
    }

    // 1. Resolve product images from IDs
    const products = await prisma.product.findMany({
      where: { id: { in: data.productIds }, userId },
      select: { id: true, title: true, images: true },
    });

    if (products.length === 0) {
      throw ApiError.badRequest("No valid products found for the provided IDs");
    }

    const productImages = products.flatMap((p) =>
      p.images.map((img) => img.url),
    );
    const primaryProduct = products[0];

    // 2. Resolve Template Data
    let templateImage =
      data.mediaType === "IMAGE" ? (data as any).templateImageUrl || "" : "";
    let assembledPrompt = "";
    let templatePrompt = "";

    if (data.templateId) {
      const template = await prisma.template.findFirst({
        where: { id: data.templateId },
      });

      if (template) {
        templatePrompt = template.promptTemplate;
        assembledPrompt = template.promptTemplate;
        templateImage =
          templateImage ||
          (template as any).previewImages?.[0] ||
          (template as any).referenceAdImage ||
          "";
      }
    }

    if (data.mediaType === "IMAGE" && (data as any).prompt) {
      assembledPrompt = (data as any).prompt;
    }

    // 3. Assemble Variable Values into prompt
    const variableValues = data.variableValues || {};
    if (Object.keys(variableValues).length > 0) {
      Object.entries(variableValues).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        assembledPrompt = assembledPrompt.replace(regex, String(value));
      });
    }

    // 4. Create Ad record
    const ad = await prisma.ad.create({
      data: {
        userId,
        productIds: data.productIds,
        templateId: data.templateId || null,
        title: `Ad for ${primaryProduct.title}`,
        assembledPrompt,
        variableValues: variableValues ?? {},
        aspectRatio: data.aspectRatio || ASPECT_RATIOS.SQUARE,
        variantsCount: data.variantsCount || 1,
        status: "PENDING",
        mediaType: data.mediaType,
        metadata: {
          color: data.color,
          ...(data.mediaType === "VIDEO"
            ? {
                scenes: (data as any).scenes,
                duration: (data as any).duration,
              }
            : {}),
        },
        videoScript:
          data.mediaType === "VIDEO" ? (data as any).videoScript : undefined,
      },
    });

    // 5. Add to queue
    await adGenerationQueue.add("generate", {
      adId: ad.id,
      userId,
      assembledPrompt,
      aspectRatio: ad.aspectRatio,
      variantsCount: ad.variantsCount,
      color: data.color,
      scenes: data.mediaType === "VIDEO" ? (data as any).scenes : undefined,
      videoScript:
        data.mediaType === "VIDEO" ? (data as any).videoScript : undefined,
      mediaType: ad.mediaType,
      duration: data.mediaType === "VIDEO" ? (data as any).duration : undefined,
      templatePrompt,
      productImages,
      templateImage,
      modelImage:
        data.mediaType === "VIDEO" ? (data as any).modelImageUrl : undefined,
    } as any);

    Logger.info(`Ad created with ID: ${ad.id}`);
    return ad;
  }

  // Update ad
  async updateAd(
    id: string,
    userId: string,
    data: Partial<{
      title: string;
      status: AdStatus;
      variableValues: any;
    }>,
  ) {
    // Verify ownership
    const ad = await this.getAdById(id, userId);

    // Update ad
    const updatedAd = await prisma.ad.update({
      where: { id },
      data: {
        title: data.title,
        status: data.status,
        variableValues: data.variableValues,
        updatedAt: new Date(),
      },
    });

    const { resultAnalysis, ...sanitizedAd } = updatedAd as any;
    return sanitizedAd;
  }

  // Delete ad
  async deleteAd(id: string, userId: string): Promise<void> {
    const ad = await this.getAdById(id, userId);

    // Only allow deleting completed or failed ads?
    // Or just delete anyway if the user wants
    await prisma.ad.delete({
      where: { id },
    });
  }

  // Bulk delete ads
  async bulkDeleteAds(userId: string, ids: string[]) {
    // Verify all ads belong to the user
    const ads = await prisma.ad.findMany({
      where: {
        id: { in: ids },
        userId,
      },
      select: { id: true },
    });

    const validatedIds = ads.map((a) => a.id);

    if (validatedIds.length === 0) {
      return { count: 0, message: "No valid ads found to delete" };
    }

    const { count } = await prisma.ad.deleteMany({
      where: {
        id: { in: validatedIds },
      },
    });

    return {
      count,
      message: `Successfully deleted ${count} ads`,
    };
  }
}

export const adsService = new AdsService();
