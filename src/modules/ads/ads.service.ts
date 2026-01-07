import { ApiError } from "../../common/errors/api-error";
import { prisma } from "../../config/database.config";
import { adGenerationQueue } from "../../config/queue.config";
import { billingService } from "../billing/billing.service";
import { GenerateAdBody, GetAdsQuery } from "./ads.validation";

import { AdStatus, Prisma, UsageType } from "@prisma/client";
import { calculatePagination } from "../../common/utils/pagination.util";
import { IAdsService } from "./ads.types";

export class AdsService implements IAdsService {
  // Get all ads for a user
  async getAds(userId: string, query: GetAdsQuery) {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const skip = (page - 1) * limit;

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
        skip,
        take: limit,
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

    return {
      data: ads,
      meta: calculatePagination(total, page, limit),
    };
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

    return ad;
  }

  // Generate ad (Step 3: Submit)
  async generateAd(userId: string, data: GenerateAdBody) {
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
        "Insufficient credits. Please top up to generate ads."
      );
    }

    // 2. Verify product and template exist and belong to user
    const [product, template] = await Promise.all([
      prisma.product.findFirst({
        where: { id: data.productId, store: { userId } },
      }),
      prisma.template.findFirst({
        where: { id: data.templateId, userId },
      }),
    ]);

    if (!product) throw ApiError.notFound("Product not found");
    if (!template) throw ApiError.notFound("Template not found");

    // 3. Create Ad record in PENDING status
    // Assemble the prompt using template and variable values
    let assembledPrompt = template.promptTemplate;
    const variableValues = data.variableValues;

    // Replace placeholders e.g. {{product_name}}
    Object.entries(variableValues).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      assembledPrompt = assembledPrompt.replace(regex, String(value));
    });

    const ad = await prisma.ad.create({
      data: {
        userId,
        productId: data.productId,
        templateId: data.templateId,
        title: data.title || `Ad for ${product.title}`,
        assembledPrompt,
        variableValues,
        aspectRatio: data.aspectRatio || "1:1",
        variantsCount: data.variantsCount || 1,
        status: AdStatus.PENDING,
      },
    });

    // 4. Deduct credit
    await billingService.checkAndDeductCredits(
      userId,
      1,
      UsageType.AD_GENERATION,
      `Ad Generation: ${ad.id}`
    );

    // 5. Add to queue for background processing (n8n webhook)
    await adGenerationQueue.add("generate", {
      adId: ad.id,
      userId,
      prompt: assembledPrompt,
      aspectRatio: ad.aspectRatio,
      variantsCount: ad.variantsCount,
    });

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
