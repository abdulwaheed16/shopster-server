import { AdStatus, MediaType, Prisma } from "@prisma/client";
import { EventEmitter } from "events";
import { ApiError } from "../../common/errors/api-error";
import Logger from "../../common/logging/logger";
import { createPaginatedResponse } from "../../common/utils/pagination.util";
import { prisma } from "../../config/database.config";
import {
  baseImageQueue,
  finalVideoQueue,
  modelImageQueue,
  singleSceneQueue,
  storyboardQueue,
} from "../../config/queue.config";
import { AdGenerationJobData } from "../../queues/ad-generation/types/job-data.types";

import { creditsService } from "../billing/credits.service";
import {
  GenerateFinalVideoDto,
  GenerateVideoBaseImageDto,
  GenerateVideoFoodScenesDto,
  GenerateVideoModelImageDto,
  GenerateVideoScenesDto,
  IAdsService,
  RegenerateSceneDto,
} from "./ads.types";
import { GenerateAdBody, GetAdsQuery } from "./ads.validation";
import { AD_COSTS } from "./constants/ad-costs";

export class AdsService implements IAdsService {
  private adEvents = new EventEmitter();

  // ============================================================
  // SSE Event Bus
  // ============================================================

  subscribeToAdUpdates(adId: string, callback: (data: any) => void) {
    const handler = (data: any) => {
      if (data.adId === adId) callback(data);
    };
    this.adEvents.on("adUpdate", handler);
    return () => this.adEvents.off("adUpdate", handler);
  }

  // @ts-ignore
  emitAdUpdate(adId: string, data: { status: AdStatus; [key: string]: any }) {
    const { status, ...rest } = data;
    const finalAdId = adId || rest.adId;

    Logger.info(
      `[AdsService] Emitting SSE update — targetId=${finalAdId} status=${status} (listeners=${this.adEvents.listenerCount("adUpdate")})`,
      { hasUrl: !!rest.url },
    );

    this.adEvents.emit("adUpdate", {
      ...rest,
      adId: finalAdId,
      status,
    });
  }

  // ============================================================
  // Concurrency Guard
  // ============================================================

  async ensureNoActiveGeneration(userId: string) {
    // [USER REQUEST] Allow multiple concurrent generation requests
    /*
    const activeDraft = await prisma.adDraft.findFirst({
      where: { userId, status: { in: ["PENDING", "PROCESSING"] } },
    });

    if (activeDraft) {
      throw ApiError.forbidden(
        "You already have an active generation in progress. Please wait for it to complete.",
      );
    }
    */
  }

  // ============================================================
  // Draft Promotion
  // ============================================================

  async promoteDraftToAd(draftId: string) {
    Logger.info(`[AdsService] Promoting draft ${draftId} to Ad`);

    const draft = await prisma.adDraft.findUnique({
      where: { id: draftId },
      include: { user: true },
    });

    if (!draft) {
      Logger.warn(`[AdsService] Draft ${draftId} not found for promotion`);
      return null;
    }

    // Create the final Ad record.
    // NOTE: draft.products is a JSON array field — use direct assignment (not { set: ... })
    // to preserve all nested fields (productId, source, imageUrl, etc.) correctly.
    const ad = await prisma.ad.create({
      data: {
        userId: draft.userId,
        title: draft.videoPrompt || `Ad ${new Date().toLocaleDateString()}`,
        mediaType: draft.mediaType as MediaType,
        status: "COMPLETED",
        products: draft.products || [],
        templateId: draft.templateId,
        categoryId: draft.categoryId,
        categoryName: draft?.categoryName as string,
        adType: draft.adType,
        assembledPrompt:
          draft.videoPrompt || draft.imagePrompt || "Promoted Ad",
        baseImageUrl: draft.baseImageUrl,
        modelImageUrl: draft.modelImageUrl,
        scenes: draft.scenes || [],
        videoScript: draft.videoScript || {},
        productDescription: draft.productDescription || "",
        duration: draft.duration,
        variantsCount: draft.videoVariants || draft.variantsCount,
        aspectRatio: draft.aspectRatio || "1:1",
        metadata: { draftId: draft.id },
      },
    });

    Logger.info(`[AdsService] Draft ${draftId} promoted — new Ad ID=${ad.id}`);

    // Clean up the draft
    await prisma.adDraft.delete({ where: { id: draftId } });

    // Notify frontend: old draftId is gone, redirect to new adId
    this.emitAdUpdate(draftId, { status: "COMPLETED", adId: ad.id });
    this.emitAdUpdate(ad.id, { status: "COMPLETED", newId: ad.id });

    return ad;
  }

  // ============================================================
  // Cancel Ad Generation
  // ============================================================

  async cancelAd(adId: string, userId: string): Promise<void> {
    Logger.info(`[AdsService] cancelAd — adId=${adId} userId=${userId}`);

    // 1. Find resource — Ad takes priority over AdDraft
    const ad = await prisma.ad.findFirst({ where: { id: adId, userId } });
    const draft = !ad
      ? await prisma.adDraft.findFirst({ where: { id: adId, userId } })
      : null;

    if (!ad && !draft) throw ApiError.notFound("Resource not found");

    const resource = ad ?? draft!;
    const resourceType = ad ? "AD" : "DRAFT";

    if (resource.status !== "PENDING" && resource.status !== "PROCESSING") {
      Logger.info(
        `[AdsService] cancelAd — ${resourceType} ${adId} already ${resource.status}, skipping.`,
      );
      return;
    }

    // 2. Remove from all BullMQ queues
    try {
      const allQueues = [
        baseImageQueue,
        modelImageQueue,
        storyboardQueue,
        singleSceneQueue,
        finalVideoQueue,
      ];
      await Promise.all(
        allQueues.map(async (q) => {
          const jobs = await q.getJobs([
            "waiting",
            "active",
            "delayed",
            "paused",
          ]);
          const job = jobs.find((j) => j.data?.adId === adId);
          if (job) {
            await job.remove();
            Logger.info(
              `[AdsService] Removed BullMQ job from "${q.name}" for ${adId}`,
            );
          }
        }),
      );
    } catch (queueError: any) {
      Logger.warn(
        `[AdsService] Failed to remove BullMQ job for ${adId}: ${queueError.message}`,
      );
    }

    // 3. Cancel or delete
    if (resourceType === "AD") {
      await prisma.ad.update({
        where: { id: adId },
        data: { status: "CANCELLED" },
      });
      Logger.info(`[AdsService] Ad ${adId} marked CANCELLED`);
    } else {
      // Drafts are deleted on cancel — no orphaned incomplete records
      await prisma.adDraft
        .delete({ where: { id: adId } })
        .catch((err) =>
          Logger.warn(
            `[AdsService] Failed to delete draft ${adId}: ${err.message}`,
          ),
        );
      Logger.info(`[AdsService] Draft ${adId} deleted on cancel`);
    }

    this.emitAdUpdate(adId, { status: "CANCELLED" });
  }

  // ============================================================
  // Get Ads (Paginated)
  // ============================================================

  async getAds(userId: string, query: GetAdsQuery, userRole: string) {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const skip = query.cursor ? 1 : (page - 1) * limit;

    const isAdmin = userRole === "ADMIN";
    const where: Prisma.AdWhereInput = { userId };

    // Status filter
    if (isAdmin && query.status) {
      where.status = query.status as AdStatus;
    } else if (!isAdmin) {
      // Regular users: only completed ads, hidden stale pending/failed
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      where.status = "COMPLETED";
      where.AND = [
        { status: { not: "FAILED" } },
        {
          OR: [
            { status: { notIn: ["PENDING", "PROCESSING"] } },
            { createdAt: { gte: fifteenMinutesAgo } },
          ],
        },
      ];
    }

    // Optional filters
    if (query.productId) {
      where.products = {
        array_contains: [{ productId: query.productId }],
      } as any;
    }
    if (query.templateId) where.templateId = query.templateId;

    if (query.search) {
      where.title = { contains: query.search, mode: "insensitive" };
    }

    if (query.days && query.days !== "all") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(query.days));
      where.createdAt = { gte: cutoff };
    }

    const orderBy: Prisma.AdOrderByWithRelationInput = {
      createdAt: query.sort === "oldest" ? "asc" : "desc",
    };

    const [ads, total] = await Promise.all([
      prisma.ad.findMany({
        where,
        take: limit,
        skip,
        cursor: query.cursor ? { id: query.cursor } : undefined,
        orderBy,
        include: { template: { select: { id: true, name: true } } },
      }),
      prisma.ad.count({ where }),
    ]);

    // Bulk-fetch product info for all ads
    const allProductRefs = [
      ...new Set(ads.flatMap((a: any) => (a.products as any[]) || [])),
    ];
    const storeProductIds = allProductRefs
      .filter((p: any) => p?.source === "STORE")
      .map((p: any) => p.productId);
    const uploadedProductIds = allProductRefs
      .filter((p: any) => p?.source === "UPLOADED")
      .map((p: any) => p.productId);

    const [storeProducts, uploadedProducts] = await Promise.all([
      storeProductIds.length > 0
        ? prisma.product.findMany({
            where: { id: { in: storeProductIds } },
            select: { id: true, title: true, images: true },
          })
        : [],
      uploadedProductIds.length > 0
        ? prisma.product.findMany({
            where: { id: { in: uploadedProductIds } },
            select: { id: true, title: true, images: true },
          })
        : [],
    ]);

    const productMap = Object.fromEntries(
      [...storeProducts, ...uploadedProducts].map((p) => [p.id, p]),
    );

    const sanitizedAds = ads.map((ad: any) => {
      delete ad.resultAnalysis;
      ad.productDetails = ad.products
        .map((p: any) => productMap[p.productId])
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

  // ============================================================
  // Get Ad By ID
  // ============================================================

  async getAdById(id: string, userId: string) {
    const ad = await prisma.ad.findFirst({
      where: { id, userId },
      include: { template: true },
    });

    if (!ad) throw ApiError.notFound("Ad not found or you don't have access");

    // Visibility rules for non-admins
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      if (ad.status === "FAILED")
        throw ApiError.notFound("Ad not found or you don't have access");
      if (ad.status === "PENDING" || ad.status === "PROCESSING") {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        if (ad.createdAt < fifteenMinutesAgo) {
          throw ApiError.notFound("Ad not found or you don't have access");
        }
      }
    }

    // Resolve product details
    const productRefs = (ad.products as any[]) || [];
    const storeIds = productRefs
      .filter((p: any) => p?.source === "STORE")
      .map((p: any) => p.productId);
    const uploadedIds = productRefs
      .filter((p: any) => p?.source === "UPLOADED")
      .map((p: any) => p.productId);

    const [storeProducts, uploadedProducts] = await Promise.all([
      storeIds.length > 0
        ? prisma.product.findMany({
            where: { id: { in: storeIds } },
            select: { id: true, title: true, images: true },
          })
        : [],
      uploadedIds.length > 0
        ? prisma.product.findMany({
            where: { id: { in: uploadedIds } },
            select: { id: true, title: true, images: true },
          })
        : [],
    ]);

    const productMap = Object.fromEntries(
      [...storeProducts, ...uploadedProducts].map((p) => [p.id, p]),
    );
    const productDetails = productRefs
      ?.map((p: any) => productMap[p.productId])
      .filter(Boolean);

    const { resultAnalysis, ...rest } = ad as any;
    return { ...rest, productDetails };
  }

  // ============================================================
  // Generate Ad (Image / Quick Submit)
  // ============================================================

  async generateAd(userId: string, data: GenerateAdBody) {
    Logger.info(
      `[AdsService] generateAd — userId=${userId} mediaType=${data.mediaType}`,
    );

    // ── 0. Auth & Subscription Check ─────────────────────────
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: { include: { plan: true } } },
    });

    if (!user) throw ApiError.notFound("User not found");

    const isActiveSubscription =
      user.subscription &&
      (user.subscription.status === "ACTIVE" ||
        user.subscription.status === "TRIALING");

    if (!isActiveSubscription) {
      throw ApiError.forbidden(
        "An active subscription is required to generate ads. Please subscribe to a plan.",
      );
    }

    await this.ensureNoActiveGeneration(userId);

    // ── 1. Guest Plan Restrictions ────────────────────────────
    const planName =
      (user.subscription as any)?.plan?.name?.toLowerCase() ?? "";
    if (planName === "guest" && data.mediaType === "VIDEO") {
      const videoData = data as any;
      if (videoData.duration && videoData.duration > 10) {
        throw ApiError.forbidden(
          "Guest accounts are limited to a maximum video duration of 10 seconds.",
        );
      }
      if (videoData.scenes && videoData.scenes.length > 2) {
        throw ApiError.forbidden(
          "Guest accounts are limited to a maximum of 2 scenes per video ad.",
        );
      }
    }

    // ── 2. Credit Check ───────────────────────────────────────
    const userBalance = await creditsService.getBalance(userId);
    const adCost = AD_COSTS[data.mediaType as MediaType];

    Logger.info(
      `[AdsService] Credit check — balance=${userBalance} required=${adCost}`,
    );

    if (userBalance < adCost) {
      throw ApiError.forbidden(
        `Insufficient credits. Required: ${adCost}, available: ${userBalance}.`,
      );
    }

    // ── 3. Resolve Products ───────────────────────────────────
    const storeProductIds = data.products
      .filter((p) => p.source === "STORE")
      .map((p) => p.productId);
    const uploadedProductIds = data.products
      .filter((p) => p.source === "UPLOADED")
      .map((p) => p.productId);

    const [storeProducts, uploadedProducts] = await Promise.all([
      storeProductIds.length > 0
        ? prisma.product.findMany({
            where: {
              id: { in: storeProductIds },
              ...(user.role !== "ADMIN" ? { store: { userId } } : {}),
            },
            select: { id: true, title: true, images: true },
          })
        : [],
      uploadedProductIds.length > 0
        ? prisma.product.findMany({
            where: {
              id: { in: uploadedProductIds },
              ...(user.role !== "ADMIN" ? { userId } : {}),
            },
            select: { id: true, title: true, images: true },
          })
        : [],
    ]);

    const products = [...storeProducts, ...uploadedProducts];
    if (products.length === 0)
      throw ApiError.badRequest("No valid products found");

    const productImages = products.flatMap((p) =>
      p.images.map((img: any) => img.url),
    );

    Logger.info(
      `[AdsService] Resolved ${products.length} products, ${productImages.length} images`,
    );

    // ── 4. Resolve Template ───────────────────────────────────
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
        Logger.info(`[AdsService] Template resolved — id=${template.id}`);
      }
    }

    if (data.mediaType === "IMAGE" && (data as any).prompt) {
      assembledPrompt = (data as any).prompt;
    }

    // ── 5. Interpolate Variable Values ────────────────────────
    const variableValues = data.variableValues || {};
    Object.entries(variableValues).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      assembledPrompt = assembledPrompt.replace(regex, String(value));
    });

    // ── 6. Create Ad Directly (Freeing AdDraft) ─────────────
    const ad = await prisma.ad.create({
      data: {
        userId,
        title:
          data.title || (data.mediaType === "VIDEO" ? "Video Ad" : "Image Ad"),
        mediaType: data.mediaType as MediaType,
        status: "PENDING",
        products: data.products as any,
        templateId: data.templateId || null,
        assembledPrompt,
        aspectRatio: data.aspectRatio || "1:1",
        variantsCount: data.variantsCount || 1,
        modelImageUrl: (data as any).modelImageUrl,
        baseImageUrl: (data as any).baseImageUrl,
        scenes: (data as any).scenes as any,
        videoScript: (data as any).videoScript as any,
        duration: (data as any).duration,
        variableValues: data.variableValues || {},
        metadata: { source: "DIRECT_SUBMIT" },
      },
    });

    Logger.info(`[AdsService] Ad created — adId=${ad.id}`);

    // Clean up any existing draft for this user
    await prisma.adDraft
      .deleteMany({
        where: { userId },
      })
      .catch((err) => Logger.warn(`Failed to delete draft: ${err.message}`));

    // ── 7. Enqueue Generation Job ─────────────────────────────
    const jobPayload: AdGenerationJobData = {
      adId: ad.id,
      userId,
      isDraft: false,
      taskType: "FINAL_VIDEO",
      mediaType: ad.mediaType,
      scenes: (Array.isArray(ad.scenes) ? ad.scenes : []).map((s: any) => ({
        id: s.id ?? s._id ?? String(s.orderNumber ?? 0),
        order: s.orderNumber,
        image: s.imageUrl ?? "",
        description: s.description ?? "",
      })),
      aspectRatio: ad.aspectRatio || "1:1",
      duration: ad.duration ?? undefined,
      videoScript: ad.videoScript as any,
      // @ts-ignore
      storyboard: (ad as any).storyboard || "",
      // @ts-ignore
      baseImage: ad.baseImageUrl ?? undefined,
      productImages: (Array.isArray(ad.products) ? ad.products : [])
        .map((p: any) => p.imageUrl)
        .filter(Boolean),
      userPrompt: ad.assembledPrompt,
    };

    await finalVideoQueue.add("generate", jobPayload);

    Logger.info(
      `[AdsService] Generation job enqueued — adId=${ad.id} mediaType=${ad.mediaType}`,
    );

    return ad;
  }

  // ============================================================
  // Update Ad
  // ============================================================

  async updateAd(
    id: string,
    userId: string,
    data: Partial<{ title: string; status: AdStatus; variableValues: any }>,
  ) {
    await this.getAdById(id, userId);

    const updatedAd = await prisma.ad.update({
      where: { id },
      data: {
        title: data.title,
        status: data.status,
        variableValues: data.variableValues,
        // @ts-ignore
        currentStep: (data as any).currentStep,
        // @ts-ignore
        baseImagePrompt: (data as any).baseImagePrompt,
        // @ts-ignore
        scenePrompt: (data as any).scenePrompt,
        updatedAt: new Date(),
      },
    });

    const { resultAnalysis, ...sanitizedAd } = updatedAd as any;
    return sanitizedAd;
  }

  // ============================================================
  // Delete Ad
  // ============================================================

  async deleteAd(id: string, userId: string): Promise<void> {
    await this.getAdById(id, userId);
    await prisma.ad.delete({ where: { id } });
    Logger.info(`[AdsService] Ad ${id} deleted`);
  }

  // ============================================================
  // Bulk Delete Ads
  // ============================================================

  async bulkDeleteAds(userId: string, ids: string[]) {
    const ads = await prisma.ad.findMany({
      where: { id: { in: ids }, userId },
      select: { id: true },
    });

    const validatedIds = ads.map((a) => a.id);
    if (validatedIds.length === 0)
      return { count: 0, message: "No valid ads found to delete" };

    const { count } = await prisma.ad.deleteMany({
      where: { id: { in: validatedIds } },
    });
    Logger.info(
      `[AdsService] Bulk delete — removed ${count} ads for user ${userId}`,
    );
    return { count, message: `Successfully deleted ${count} ads` };
  }

  // ============================================================
  // Video Step 1 – Generate Base Image
  // ============================================================

  async generateVideoBaseImage(
    userId: string,
    data: GenerateVideoBaseImageDto,
  ) {
    Logger.info(`[AdsService] generateVideoBaseImage — userId=${userId}`, data);
    Logger.info(`[AdsService] generateVideoBaseImage — data=${data}`);

    // Lookup category name from DB to ensure consistency
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
      select: { name: true },
    });

    // await this.ensureNoActiveGeneration(userId);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const draft = await prisma.adDraft.create({
      data: {
        userId,
        mediaType: "VIDEO",
        status: "PENDING",
        expiresAt,
        products: data.products || [],
        categoryId: data.categoryId,
        categoryName: category?.name,
        adType: data.adType || null,
        modelImageUrl: data.modelImage || null,
        templateId: data?.templateId || null,
      } as any,
    });

    Logger.info(`[AdsService] Created draft ${draft.id} — task=BASE_IMAGE`);

    const jobPayload: AdGenerationJobData = {
      adId: draft.id,
      userId,
      isDraft: true,
      taskType: "BASE_IMAGE",
      status: "PENDING",
      mediaType: "VIDEO",
      categoryName: category?.name || "",
      adType: data.adType,
      products: data.products,
      productImages: (data.products || []).map((p) => p.imageUrl),
      modelImage: data.modelImage,
      templateImage: data?.templateImage,
      templateId: data?.templateId || "",
      userPrompt: data?.userPrompt || "",
    };

    Logger.info(
      `[AdsService] BASE_IMAGE job payload — draftId=${draft.id}`,
      jobPayload,
    );

    await baseImageQueue.add("generate-base-image", jobPayload);
    Logger.info(`[AdsService] BASE_IMAGE job enqueued — draftId=${draft.id}`);

    this.emitAdUpdate(draft.id, {
      status: "PROCESSING", // actual processing starts when worker picks the job.
      taskType: "BASE_IMAGE",
    });

    return { adId: draft.id };
  }

  // ============================================================
  // Video Step 2 – Generate Scenes (Storyboard)
  // ============================================================

  async generateVideoScenes(userId: string, data: GenerateVideoScenesDto) {
    Logger.info(
      `[AdsService] generateVideoScenes — userId=${userId} adId=${data.adId}`,
    );

    let draft;
    let isNew = false;

    if (data.adId && data.adId !== "undefined") {
      try {
        draft = await prisma.adDraft.findFirst({
          where: { id: data.adId, userId },
        });
      } catch (err) {
        Logger.warn(`[AdsService] Error finding draft ${data.adId}: ${err}`);
      }
    }

    if (!draft) {
      // No draft found — create one as fallback
      // await this.ensureNoActiveGeneration(userId);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      draft = await prisma.adDraft.create({
        data: {
          userId,
          mediaType: "VIDEO",
          expiresAt,
          scenePrompt: data?.userPrompt || "",
          baseImageUrl: data.baseImage || null,
          storyboard: data.storyboard,
          productDescription: data.productDescription,
          templateId: data.templateId,
          categoryId: data.categoryId,
          categoryName: data.categoryName,
          adType: data.adType,
        } as any,
      });
      isNew = true;
      Logger.info(
        `[AdsService] Created new draft ${draft.id} in generateVideoScenes`,
      );
    } else {
      draft = await prisma.adDraft.update({
        where: { id: draft.id },
        data: {
          baseImageUrl: data.baseImage || draft.baseImageUrl,
        },
      });
      Logger.info(`[AdsService] Updated draft ${draft.id} — task=STORYBOARD`);
    }

    if (isNew) {
      this.emitAdUpdate(draft.id, {
        status: "PENDING",
      });
    }

    const jobPayload: AdGenerationJobData = {
      adId: draft.id,
      userId,
      isDraft: true,
      taskType: "STORYBOARD",
      status: "PENDING",
      mediaType: "VIDEO",
      baseImage: data.baseImage || draft.baseImageUrl || "",
      storyboard: data.storyboard || draft.storyboard || "",
      productDescription:
        data.productDescription || draft.productDescription || "",
      categoryName: data.categoryName || draft.categoryName || "",
      adType: data.adType || draft.adType || "",
      templateId: data.templateId || draft.templateId || "",
      userPrompt: data?.userPrompt || "",
      productImages: (Array.isArray(draft.products) ? draft.products : [])
        .map((p: any) => p.imageUrl)
        .filter(Boolean),
    };

    await storyboardQueue.add("generate-storyboard", jobPayload);
    this.emitAdUpdate(draft.id, {
      status: "PROCESSING",
    });
    Logger.info(`[AdsService] STORYBOARD job enqueued — draftId=${draft.id}`);

    return { adId: draft.id, status: "PROCESSING" };
  }

  // ============================================================
  // Video Step 2 (Food) – Generate Food Category Scenes
  // ============================================================

  async generateVideoFoodScenes(
    userId: string,
    data: GenerateVideoFoodScenesDto,
  ) {
    Logger.info(`[AdsService] generateVideoFoodScenes — userId=${userId}`, {
      productImagesCount: data.products?.length,
      templateId: data.templateId,
      categoryId: data.categoryId,
    });

    // Lookup category name from DB
    let categoryName = data.category;
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
        select: { name: true },
      });
      if (category) {
        categoryName = category.name;
      }
    }

    await this.ensureNoActiveGeneration(userId);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const draft = await prisma.adDraft.create({
      data: {
        userId,
        mediaType: "VIDEO",
        status: AdStatus.PENDING,
        expiresAt,
        products: data.products || [],
        templateId: data.templateId || null,
        categoryId: data.categoryId,
        categoryName: categoryName,
        adType: (data as any).adType || null,
        productDescription: (data as any).productDescription || null,
      } as any,
    });

    Logger.info(`[AdsService] Food scene draft created — draftId=${draft.id}`);

    // Emit AD_CREATED so frontend captures the draftId
    this.emitAdUpdate(draft.id, {
      status: "PENDING",
    });

    const jobPayload: AdGenerationJobData = {
      adId: draft.id,
      userId,
      isDraft: true,
      taskType: "STORYBOARD",
      status: "PENDING",
      mediaType: "VIDEO",
      baseImage: "",
      categoryName: categoryName || "",
      products: data.products,
      productImages: (data.products || []).map((p) => p.imageUrl),
      templateId: data.templateId ?? undefined,
      storyboard: "",
      productDescription: (data as any).productDescription || "",
      userPrompt:
        (data as any).userPrompt ||
        (data as any).productDescription ||
        draft.productDescription ||
        "",
      adType: (data as any).adType || "",
    };

    await storyboardQueue.add("generate-food-scenes", jobPayload);
    Logger.info(`[AdsService] FOOD_SCENES job enqueued — draftId=${draft.id}`);
    return { adId: draft.id, status: "PENDING" };
  }

  // ============================================================
  // Video Step 3 – Regenerate Single Scene
  // ============================================================

  async regenerateScene(
    userId: string,
    adId: string,
    data: RegenerateSceneDto,
  ) {
    const { sceneId, description } = data;
    Logger.info(
      `[AdsService] regenerateScene — adId=${adId} sceneId=${sceneId}`,
    );

    // Check Ad first, then AdDraft
    let resource: any = await prisma.ad.findFirst({
      where: { id: adId, userId },
    });
    let isDraft = false;

    if (!resource) {
      resource = await prisma.adDraft.findFirst({
        where: { id: adId, userId },
      });
      isDraft = true;
    }

    if (!resource) throw ApiError.notFound("Resource not found");

    // Resource update logic previously here (flowState removed)

    Logger.info(`[AdsService] SINGLE_SCENE payload:`, {
      adId,
      sceneId,
      description,
      baseImage: resource.baseImageUrl,
      isDraft,
    });

    const jobPayload: AdGenerationJobData = {
      adId,
      userId,
      isDraft,
      taskType: "SINGLE_SCENE",
      status: "PENDING",
      mediaType: "VIDEO",
      targetSceneId: sceneId,
      assembledPrompt: data.description,
      userPrompt: data.description, // For n8n
      baseImage: resource.baseImageUrl || "",
      productDescription: resource.productDescription || "",
    };

    await singleSceneQueue.add("regenerate-single-scene", jobPayload);

    this.emitAdUpdate(adId, {
      status: "PROCESSING",
      sceneId,
    });

    return { adId, status: "PROCESSING", sceneId };
  }

  // ============================================================
  // Video Step 3 – Regenerate All Scenes
  // ============================================================

  async regenerateAllScenes(userId: string, adId: string) {
    Logger.info(`[AdsService] regenerateAllScenes — adId=${adId}`);

    let resource: any = await prisma.ad.findFirst({
      where: { id: adId, userId },
    });
    let isDraft = false;

    if (!resource) {
      await prisma.adDraft.update({
        where: { id: adId },
        data: {
          status: "PENDING",
        },
      });
      isDraft = true;
    } else {
      await prisma.ad.update({
        where: { id: adId },
        data: {
          status: "PENDING",
        },
      });
    }

    if (!resource) throw ApiError.notFound("Resource not found");

    Logger.info(`[AdsService] ALL_SCENES payload:`, {
      adId,
      baseImage: resource.baseImageUrl,
      templateId: resource.templateId,
      isDraft,
    });

    const jobPayload: AdGenerationJobData = {
      adId,
      userId,
      isDraft,
      taskType: "ALL_SCENES",
      status: "PENDING",
      mediaType: "VIDEO",
      baseImage: resource.baseImageUrl ?? "",
      storyboard: resource.storyboard || "",
      productDescription: resource.productDescription || "",
      userPrompt:
        (resource as any).scenePrompt ||
        (resource as any).baseImagePrompt ||
        (resource as any).productDescription ||
        "",
      categoryName: (resource as any).categoryName || "",
      adType: (resource as any).adType || "",
    };

    await storyboardQueue.add("regenerate-all-scenes", jobPayload);

    this.emitAdUpdate(adId, {
      status: "PROCESSING",
    });
    Logger.info(`[AdsService] ALL_SCENES job enqueued — adId=${adId}`);

    return { adId, status: "PROCESSING" };
  }

  // ============================================================
  // Video Step 4 – Generate Final Video
  // ============================================================

  async generateFinalVideo(userId: string, data: GenerateFinalVideoDto) {
    const { adId } = data;
    Logger.info(
      `[AdsService] generateFinalVideo — adId=${adId} userId=${userId}`,
    );

    // Draft MUST exist — Ad is only created when FINAL_VIDEO callback succeeds
    const draft: any = await prisma.adDraft.findFirst({
      where: { id: adId, userId },
    });
    if (!draft)
      throw ApiError.notFound("Ad draft not found. Please restart the flow.");

    // ── Credit check ──────────────────────────────────────────
    const adCost = AD_COSTS[draft.mediaType as MediaType] || 10;
    const userBalance = await creditsService.getBalance(userId);

    Logger.info(
      `[AdsService] Final video credit check — balance=${userBalance} required=${adCost}`,
    );

    if (userBalance < adCost) {
      throw ApiError.forbidden(
        `Insufficient credits. Required: ${adCost}, available: ${userBalance}.`,
      );
    }

    // ── Pull scene data from request or draft ─────────────────
    const scenes = (data.scenes || (draft.scenes as any[]) || []).map(
      (s: any) => ({
        order: s.order ?? s.orderNumber ?? 0,
        image: s.image ?? s.imageUrl ?? "",
        description: s.description ?? "",
      }),
    );

    // ── Update draft — mark FINAL_VIDEO as in-progress ────────
    await prisma.adDraft.update({
      where: { id: adId },
      data: {
        status: "PENDING",
        scenes,
        duration: data.duration ?? (draft as any).duration,
        aspectRatio: data.aspectRatio ?? (draft as any).aspectRatio,
      } as any,
    });

    // ── Enqueue job — promotion happens in n8n callback ───────
    const jobPayload: AdGenerationJobData = {
      adId,
      userId,
      isDraft: true,
      taskType: "FINAL_VIDEO",
      status: "PENDING",
      mediaType: draft.mediaType as any,
      scenes,
      baseImage: draft.baseImageUrl || "",
      storyboard: draft.storyboard || "",
      productDescription: draft.productDescription || "",
      categoryName: (draft as any).categoryName || "",
      adType: (draft as any).adType || "",
      userPrompt:
        (draft as any).videoPrompt ||
        (draft as any).baseImagePrompt ||
        (draft as any).productDescription ||
        "",
      duration: data.duration ?? (draft as any).duration ?? 10,
      aspectRatio: data.aspectRatio ?? (draft as any).aspectRatio ?? "9:16",
    };

    await finalVideoQueue.add("generate-final-video", jobPayload);

    this.emitAdUpdate(adId, {
      status: "PROCESSING",
    });
    Logger.info(`[AdsService] FINAL_VIDEO job enqueued — draftId=${adId}`);

    return { adId, status: "PROCESSING" };
  }

  // ============================================================
  // Video Model Image Generation
  // ============================================================

  async generateVideoModelImage(
    userId: string,
    data: GenerateVideoModelImageDto,
  ) {
    Logger.info(`[AdsService] generateVideoModelImage — userId=${userId}`, {
      gender: data.gender,
      age: data.age,
      skin: data.skin,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    let draftId: string;
    let isNew = false;

    // Reuse existing draft if adId provided and valid
    if (data.adId && data.adId !== "undefined") {
      let existingDraft: any = null;
      try {
        existingDraft = await prisma.adDraft.findFirst({
          where: { id: data.adId, userId },
        });
      } catch (err) {
        Logger.warn(
          `[AdsService] Invalid adId in generateVideoModelImage: ${data.adId}`,
        );
      }

      if (existingDraft) {
        await prisma.adDraft.update({
          where: { id: existingDraft.id },
          data: {
            status: "PENDING",
            videoPrompt: data.notes,
          } as any,
        });
        draftId = existingDraft.id;
        Logger.info(`[AdsService] Reusing draft ${draftId} — task=MODEL_IMAGE`);
      } else {
        // adId provided but not found — create new
        await this.ensureNoActiveGeneration(userId);
        const newDraft = await prisma.adDraft.create({
          data: {
            userId,
            mediaType: "VIDEO",
            currentStep: 1,
            status: "PENDING",
            expiresAt,
            videoPrompt: data.notes,
          } as any,
        });
        draftId = newDraft.id;
        isNew = true;
        Logger.info(
          `[AdsService] Created new draft ${draftId} — task=MODEL_IMAGE`,
        );
      }
    } else {
      await this.ensureNoActiveGeneration(userId);
      const newDraft = await prisma.adDraft.create({
        data: {
          userId,
          mediaType: "VIDEO",
          currentStep: 1,
          status: "PENDING",
          expiresAt,
          videoPrompt: data.notes,
        } as any,
      });
      draftId = newDraft.id;
      isNew = true;
      Logger.info(
        `[AdsService] Created new draft ${draftId} — task=MODEL_IMAGE`,
      );
    }

    if (isNew) {
      this.emitAdUpdate(draftId, {
        status: "PENDING",
      });
    }

    await modelImageQueue.add("generate-model-image", {
      adId: draftId,
      userId,
      isDraft: true,
      taskType: "MODEL_IMAGE",
      status: "PENDING",
      mediaType: "VIDEO",
      gender: data.gender,
      age: data.age,
      skinColor: data.skin,
      userPrompt: data.notes,
    });

    Logger.info(`[AdsService] MODEL_IMAGE job enqueued — draftId=${draftId}`);
    return { adId: draftId };
  }
}

export const adsService = new AdsService();
