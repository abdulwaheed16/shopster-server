import { ApiError } from "../../common/errors/api-error";
import { prisma } from "../../config/database.config";
import { adGenerationQueue } from "../../config/queue.config";
import { billingService } from "../billing/billing.service";
import { GenerateAdBody, GetAdsQuery } from "./ads.validation";

import { AdStatus, Prisma, UsageType } from "@prisma/client";
import { createPaginatedResponse } from "../../common/utils/pagination.util";
import { requestDeduplicator } from "../../common/utils/request-deduplication.util";
import { ASPECT_RATIOS } from "../ai/ai.constants";
import { IAdsService } from "./ads.types";

export class AdsService implements IAdsService {
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
          uploadedProduct: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
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
        uploadedProduct: true,
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
    // 0. Deduplicate request
    const dedupKey = requestDeduplicator.generateKey(userId, data);
    if (requestDeduplicator.isDuplicate(dedupKey)) {
      throw ApiError.badRequest(
        "A similar generation request is already being processed. Please wait a few seconds.",
      );
    }

    // 1. Check user credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    // Each generation costs 1 credit
    if (user.credits < 1) {
      throw ApiError.badRequest(
        "Insufficient credits. Please top up to generate ads.",
      );
    }

    // 2. Resolve Product Data
    let productTitle = data.productTitle || "";
    let productImage = data.productImageUrl || "";

    // If IDs are provided and URLs are missing, fetch from DB as fallback
    if (!productImage && data.productId) {
      const product = await prisma.product.findFirst({
        where: { id: data.productId, store: { userId } },
      });
      if (product) {
        productTitle = productTitle || product.title;
        productImage = product.images[0]?.url || "";
      }
    } else if (!productImage && data.uploadedProductId) {
      const uploadedProduct = await prisma.uploadedProduct.findFirst({
        where: { id: data.uploadedProductId, userId },
      });
      if (uploadedProduct) {
        productTitle = productTitle || uploadedProduct.title;
        productImage = (uploadedProduct.imageUrl as string) || "";
      }
    }

    // Default title if still empty
    productTitle = productTitle || "Product";

    // 3. Resolve Template Data
    let templateImage = data.templateImageUrl || "";
    let assembledPrompt = "";

    if (data.templateId) {
      const template = await prisma.template.findFirst({
        where: { id: data.templateId },
      });

      if (template) {
        assembledPrompt = template.promptTemplate;
        templateImage =
          templateImage || (template as any).referenceAdImage || "";
      }
    }

    // Fallbacks for prompt
    if (!assembledPrompt) {
      if (data.thoughts) {
        assembledPrompt = `Create a video ad for ${productTitle} based on: ${data.thoughts}`;
      } else {
        assembledPrompt = `Showcase the product: ${productTitle}`;
      }
    }

    // 4. Assemble Variable Values
    const variableValues = data.variableValues || {};
    if (Object.keys(variableValues).length > 0) {
      Object.entries(variableValues).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        assembledPrompt = assembledPrompt.replace(regex, String(value));
      });
    }

    // Append thoughts and video type
    if (data.thoughts)
      assembledPrompt += `\nAdditional instructions: ${data.thoughts}`;
    if (data.videoType)
      assembledPrompt += `\nCamera Movement: ${data.videoType.replace(/_/g, " ")}`;

    // 4. Create Ad record
    const ad = await prisma.ad.create({
      data: {
        userId,
        productId: data.productId || null,
        uploadedProductId: data.uploadedProductId || null,
        templateId: data.templateId || null,
        title: data.title || `Ad for ${productTitle}`,
        assembledPrompt,
        variableValues: variableValues ?? {}, // Ensure JSON compatibility
        aspectRatio: data.aspectRatio || ASPECT_RATIOS.SQUARE,
        variantsCount: data.variantsCount || 1,
        status: "PENDING",
        mediaType: data.videoType ? "VIDEO" : "IMAGE",
        metadata: {
          style: data.style,
          color: data.color,
          videoType: data.videoType,
          thoughts: data.thoughts,
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
      videoType: data.videoType || undefined,
      mediaType: ad.mediaType,
      productImage: productImage,
      templateImage: templateImage,
      // templateAnalysis is left out here if we don't fetch the template object,
      // but the worker/processor can re-analyze if templateImage is present.
    } as any);

    return ad;
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
