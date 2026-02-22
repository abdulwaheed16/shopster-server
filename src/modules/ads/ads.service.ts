import { AdStatus, Prisma, UsageType } from "@prisma/client";
import { EventEmitter } from "events";
import { ApiError } from "../../common/errors/api-error";
import Logger from "../../common/logging/logger";
import { createPaginatedResponse } from "../../common/utils/pagination.util";
import { prisma } from "../../config/database.config";
import { adGenerationQueue } from "../../config/queue.config";
import { ASPECT_RATIOS } from "../ai/ai.constants";
import { billingService } from "../billing/billing.service";
import { IAdsService } from "./ads.types";
import { GenerateAdBody, GetAdsQuery } from "./ads.validation";

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
  async getAds(userId: string, query: GetAdsQuery) {
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
      where.productId = query.productId;
    }

    if (query.templateId) {
      where.templateId = query.templateId;
    }

    if (query.storeId) {
      where.product = {
        storeId: query.storeId,
      };
    }

    if (query.search) {
      where.title = {
        contains: query.search,
        mode: "insensitive",
      };
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
          product: {
            select: {
              id: true,
              title: true,
              images: true,
              store: {
                select: {
                  name: true,
                },
              },
            },
          },
          template: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.ad.count({ where }),
    ]);

    // Strip internal analysis (Optimization/Privacy)
    const sanitizedAds = ads.map((ad: any) => {
      delete ad.resultAnalysis;
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
      where: {
        id,
        userId,
      },
      include: {
        product: true,
        template: true,
      },
    });

    if (!ad) {
      throw ApiError.notFound("Ad not found or you don't have access");
    }

    const { resultAnalysis, ...sanitizedAd } = ad as any;

    return sanitizedAd;
  }

  // Generate ad (Step 3: Submit)
  async generateAd(userId: string, data: GenerateAdBody) {
    // 0. Deduplicate request (Disabled for rapid testing)
    /*
    const dedupKey = requestDeduplicator.generateKey(userId, data);
    if (requestDeduplicator.isDuplicate(dedupKey)) {
      throw ApiError.badRequest(
        "A similar generation request is already being processed. Please wait a few seconds.",
      );
    }
    */

    // 1. Check user credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { creditWallet: { select: { balance: true } } },
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    // Each generation costs 1 credit
    if ((user?.creditWallet?.balance || 0) < 1) {
      throw ApiError.badRequest(
        "Insufficient credits. Please top up to generate ads.",
      );
    }

    // 2. Resolve Product Data
    let productTitle = data.productTitle || "";
    let productImages: string[] = [];

    if (Array.isArray(data.productImageUrls)) {
      productImages = data.productImageUrls;
    } else if (typeof data.productImageUrls === "string") {
      productImages = [data.productImageUrls];
    }

    // If IDs are provided and URLs are missing, fetch from DB as fallback
    if (
      productImages.length === 0 &&
      (data.productId || data.uploadedProductId)
    ) {
      const targetId = data.productId || data.uploadedProductId;
      const product = await prisma.product.findFirst({
        where: { id: targetId, userId },
      });
      if (product) {
        productTitle = productTitle || product.title;
        productImages = product.images.map((img) => img.url);
      }
    }

    const productImage = productImages[0] || ""; // Use first as primary fallback for backward compatibility in some logic

    // Default title if still empty
    productTitle = productTitle || "Product";

    // 3. Resolve Template Data
    let templateImage = data.templateImageUrl || "";
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

    if (data.prompt) {
      assembledPrompt = data.prompt;
    }

    // 4. Assemble Variable Values
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
        productId: data.productId || data.uploadedProductId || null,
        templateId: data.templateId || null,
        title: data.title || `Ad for ${productTitle}`,
        assembledPrompt,
        variableValues: variableValues ?? {}, // Ensure JSON compatibility
        aspectRatio: data.aspectRatio || ASPECT_RATIOS.SQUARE,
        variantsCount: data.variantsCount || 1,
        status: "PENDING",
        mediaType: data.mediaType || (data?.scenes ? "VIDEO" : "IMAGE"),
        metadata: {
          style: data.style,
          color: data.color,
          scenes: data.scenes,
          duration: data.duration,
        },
      },
    });

    // 5. Deduct credit
    await billingService.checkAndDeductCredits(
      userId,
      1,
      UsageType.AD_GENERATION,
      `Ad Generation: ${ad.id}`,
    );

    // 6. Add to queue for background processing
    await adGenerationQueue.add("generate", {
      adId: ad.id,
      userId,
      assembledPrompt,
      aspectRatio: ad.aspectRatio,
      variantsCount: ad.variantsCount,
      style: data.style,
      color: data.color,
      scenes: data.scenes,
      mediaType: ad.mediaType,
      duration: data.duration,
      templatePrompt: templatePrompt,
      productImages,
      templateImage,
      modelImage: data.modelImageUrl,
    } as any);

    // 7. Return pending ad (actual queue processing)

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
