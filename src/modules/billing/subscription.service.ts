import { Plan, Subscription, SubscriptionStatus } from "@prisma/client";
import { prisma } from "../../config/database.config";
import { ISubscriptionService } from "./billing.types";

export class SubscriptionService implements ISubscriptionService {
  async getSubscriptionByUserId(
    userId: string,
  ): Promise<(Subscription & { plan: Plan }) | null> {
    return await prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
  }

  async getSubscriptionByStripeId(
    stripeSubscriptionId: string,
  ): Promise<(Subscription & { plan: Plan }) | null> {
    return await prisma.subscription.findFirst({
      where: { stripeSubscriptionId },
      include: { plan: true },
    });
  }

  async upsertSubscription(data: Partial<Subscription>): Promise<Subscription> {
    // If we have a userId, we can use it as a unique key for upsert
    if (data.userId) {
      return await prisma.subscription.upsert({
        where: { userId: data.userId },
        update: data,
        create: data as any,
      });
    }

    // Fallback: if no userId, we can't easily upsert without a unique key in Prisma
    throw new Error("userId is required for subscription upsert");
  }

  async updateSubscriptionStatus(
    stripeSubscriptionId: string,
    status: SubscriptionStatus,
  ) {
    const sub = await this.getSubscriptionByStripeId(stripeSubscriptionId);
    if (!sub) return null;

    return await prisma.subscription.update({
      where: { id: sub.id },
      data: { status },
    });
  }

  async updateSubscriptionPeriod(
    stripeSubscriptionId: string,
    data: {
      currentPeriodEnd: Date;
      currentPeriodStart: Date;
      status?: SubscriptionStatus;
      cancelAtPeriodEnd?: boolean;
      customCreditsPerMonth?: number;
      customStoresLimit?: number;
      pendingPlanId?: string;
    },
  ) {
    const sub = await this.getSubscriptionByStripeId(stripeSubscriptionId);
    if (!sub) return null;

    return await prisma.subscription.update({
      where: { id: sub.id },
      data,
    });
  }
}

export const subscriptionService = new SubscriptionService();
