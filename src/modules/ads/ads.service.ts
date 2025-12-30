import { ApiError } from "../../common/errors/api-error";
import { PaginatedResult } from "../../common/types/pagination.types";
import { prisma } from "../../config/database.config";
import { adGenerationQueue } from "../../config/queue.config";
import { billingService } from "../billing/billing.service";
import { GenerateAdInput, GetAdsQuery } from "./ads.validation";

export class AdsService {
  // Get all ads for a user
  async getAds(
    userId: string,
    query: GetAdsQuery
  ): Promise<PaginatedResult<any>> {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.productId) {
      where.productId = query.productId;
    }

    if (query.templateId) {
      where.templateId = query.templateId;
    }

    const [ads, total] = await Promise.all([
      prisma.ad.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              images: true,
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

    return {
      data: ads,
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

  // Get ad by ID
  async getAdById(id: string, userId: string) {
    const ad = await prisma.ad.findFirst({
      where: { id, userId },
      include: {
        product: true,
        template: true,
      },
    });

    if (!ad) {
      throw ApiError.notFound("Ad not found");
    }

    return ad;
  }

  // Generate ad (add to queue)
  async generateAd(userId: string, data: GenerateAdInput) {
    // Verify product ownership
    const product = await prisma.product.findFirst({
      where: {
        id: data.productId,
        store: { userId },
      },
    });

    if (!product) {
      throw ApiError.notFound("Product not found");
    }

    // Verify template ownership
    const template = await prisma.template.findFirst({
      where: {
        id: data.templateId,
        userId,
      },
    });

    if (!template) {
      throw ApiError.notFound("Template not found");
    }

    // Deduct credits (1 credit per ad generation)
    await billingService.checkAndDeductCredits(
      userId,
      1,
      "AD_GENERATION",
      `Generation of ${data.variantsCount || 1} variants for: ${
        data.title || "Ad"
      }`
    );

    // Assemble prompt by replacing variables
    let assembledPrompt = template.promptTemplate;
    for (const [key, value] of Object.entries(data.variableValues)) {
      assembledPrompt = assembledPrompt.replace(
        new RegExp(`{{${key}}}`, "g"),
        String(value)
      );
    }

    // Create ad with PENDING status
    const ad = await prisma.ad.create({
      data: {
        userId,
        productId: data.productId,
        templateId: data.templateId,
        title: data.title,
        assembledPrompt,
        variableValues: data.variableValues,
        aspectRatio: data.aspectRatio,
        variantsCount: data.variantsCount,
        status: "PENDING",
      },
    });

    // Add job to queue
    await adGenerationQueue.add("generate-ad", {
      adId: ad.id,
      userId,
      assembledPrompt,
      aspectRatio: data.aspectRatio,
      variantsCount: data.variantsCount,
      productImage: product.images[0]?.url,
    });

    return ad;
  }

  // Delete ad
  async deleteAd(id: string, userId: string) {
    const ad = await this.getAdById(id, userId);

    await prisma.ad.delete({
      where: { id },
    });
  }

  // Bulk delete ads
  async bulkDeleteAds(userId: string, ids: string[]) {
    // Verify ownership of all ads
    const adsCount = await prisma.ad.count({
      where: {
        id: { in: ids },
        userId,
      },
    });

    if (adsCount !== ids.length) {
      throw ApiError.unauthorized("One or more ads not found or unauthorized");
    }

    // Delete all ads
    const result = await prisma.ad.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return {
      count: result.count,
      message: `Successfully deleted ${result.count} ads`,
    };
  }
}

export const adsService = new AdsService();
