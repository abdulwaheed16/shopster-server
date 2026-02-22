import { SubscriptionStatus, UsageType } from "@prisma/client";
import { ApiError } from "../../common/errors/api-error";
import {
  createPaginatedResponse,
  getPrismaSkip,
  parsePaginationParams,
} from "../../common/utils/pagination.util";
import { prisma } from "../../config/database.config";
import {
  CreatePlanBody,
  CreateSubscriptionBody,
  UpdatePlanBody,
  UpdateSubscriptionBody,
} from "./billing.validation";
import { creditsService } from "./credits.service";

// ─── Plan Admin Service ────────────────────────────────────────────────────────

export class PlanAdminService {
  async getPlans(query: any) {
    const {
      page,
      limit,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = parsePaginationParams(query);

    const where: any = {};
    if (query.isActive !== undefined)
      where.isActive = query.isActive === "true";
    if (query.type) where.type = query.type;
    if (query.isPublic !== undefined)
      where.isPublic = query.isPublic === "true";

    const [plans, total] = await Promise.all([
      prisma.plan.findMany({
        where,
        skip: getPrismaSkip(page, limit),
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { _count: { select: { subscriptions: true } } },
      }),
      prisma.plan.count({ where }),
    ]);

    return createPaginatedResponse(plans, total, page, limit);
  }

  async getPlanById(id: string) {
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: { _count: { select: { subscriptions: true } } },
    });
    if (!plan) throw ApiError.notFound("Plan not found");
    return plan;
  }

  async createPlan(data: CreatePlanBody) {
    const exists = await prisma.plan.findFirst({
      where: { OR: [{ name: data.name }, { slug: data.slug }] },
    });
    if (exists)
      throw ApiError.conflict("A plan with this name or slug already exists");

    return await prisma.plan.create({
      data: {
        ...data,
        prices: data.prices as any,
        features: data.features as any,
      } as any,
    });
  }

  async updatePlan(id: string, data: UpdatePlanBody) {
    await this.getPlanById(id); // Validates existence

    if (data.name || data.slug) {
      const conflict = await prisma.plan.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(data.name ? [{ name: data.name }] : []),
                ...(data.slug ? [{ slug: data.slug }] : []),
              ],
            },
          ],
        },
      });
      if (conflict)
        throw ApiError.conflict("A plan with this name or slug already exists");
    }

    return await prisma.plan.update({
      where: { id },
      data: {
        ...data,
        prices: data.prices ? (data.prices as any) : undefined,
        features: data.features as any,
      } as any,
    });
  }

  async deletePlan(id: string) {
    const plan = await this.getPlanById(id);
    const hasActiveSubs = await prisma.subscription.count({
      where: { planId: id, status: "ACTIVE" },
    });
    if (hasActiveSubs > 0) {
      throw ApiError.badRequest(
        `Cannot delete plan with ${hasActiveSubs} active subscription(s). Archive it instead by setting isActive: false.`,
      );
    }
    await prisma.plan.delete({ where: { id } });
    return plan;
  }
}

// ─── Subscription Admin Service ────────────────────────────────────────────────

export class SubscriptionAdminService {
  async getSubscriptions(query: any) {
    const {
      page,
      limit,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = parsePaginationParams(query);

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.userId) where.userId = query.userId;
    if (query.planId) where.planId = query.planId;

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip: getPrismaSkip(page, limit),
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          plan: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
            },
          },
        },
      }),
      prisma.subscription.count({ where }),
    ]);

    return createPaginatedResponse(subscriptions, total, page, limit);
  }

  async getSubscriptionById(id: string) {
    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: {
        plan: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            creditWallet: true,
          },
        },
        invoices: { orderBy: { date: "desc" }, take: 10 },
      },
    });
    if (!sub) throw ApiError.notFound("Subscription not found");
    return sub;
  }

  async createSubscription(data: CreateSubscriptionBody) {
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw ApiError.notFound("User not found");

    const plan = await prisma.plan.findUnique({ where: { id: data.planId } });
    if (!plan) throw ApiError.notFound("Plan not found");

    // Upsert: one subscription per user
    const now = new Date();
    const periodEnd = data.currentPeriodEnd
      ? new Date(data.currentPeriodEnd)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1_000);

    const subscription = await prisma.subscription.upsert({
      where: { userId: data.userId },
      create: {
        userId: data.userId,
        planId: data.planId,
        interval: data.interval as any,
        status: data.status as SubscriptionStatus,
        currentPeriodStart: data.currentPeriodStart
          ? new Date(data.currentPeriodStart)
          : now,
        currentPeriodEnd: periodEnd,
        stripeSubscriptionId: data.stripeSubscriptionId,
      },
      update: {
        planId: data.planId,
        interval: data.interval as any,
        status: data.status as SubscriptionStatus,
        currentPeriodStart: data.currentPeriodStart
          ? new Date(data.currentPeriodStart)
          : now,
        currentPeriodEnd: periodEnd,
        stripeSubscriptionId: data.stripeSubscriptionId,
        pendingPlanId: null,
      },
      include: { plan: true },
    });

    // Grant initial credits for the new plan
    if (plan.creditsPerMonth > 0) {
      await creditsService.addCredits(
        data.userId,
        plan.creditsPerMonth,
        UsageType.MONTHLY_REFILL,
        `Subscription created: ${plan.name} plan`,
      );
    }

    return subscription;
  }

  async updateSubscription(id: string, data: UpdateSubscriptionBody) {
    await this.getSubscriptionById(id);

    const updateData: any = { ...data };
    if (data.currentPeriodStart)
      updateData.currentPeriodStart = new Date(data.currentPeriodStart as any);
    if (data.currentPeriodEnd)
      updateData.currentPeriodEnd = new Date(data.currentPeriodEnd as any);

    return await prisma.subscription.update({
      where: { id },
      data: updateData,
      include: { plan: true },
    });
  }

  async cancelSubscription(id: string) {
    const sub = await this.getSubscriptionById(id);
    return await prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.CANCELED, cancelAtPeriodEnd: false },
      include: { plan: true },
    });
  }

  async getUserSubscription(userId: string) {
    return await prisma.subscription.findUnique({
      where: { userId },
      include: {
        plan: true,
        invoices: { orderBy: { date: "desc" }, take: 10 },
      },
    });
  }
}

export const planAdminService = new PlanAdminService();
export const subscriptionAdminService = new SubscriptionAdminService();
