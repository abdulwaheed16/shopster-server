import { Plan, Subscription, SubscriptionStatus } from "@prisma/client";
import { prisma } from "../../config/database.config";
import { ISubscriptionService } from "./billing.types";

export class SubscriptionService implements ISubscriptionService {
  async getSubscriptionByUserId(
    userId: string
  ): Promise<(Subscription & { plan: Plan }) | null> {
    return await prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
  }

  async getSubscriptionByStripeId(
    stripeSubscriptionId: string
  ): Promise<(Subscription & { plan: Plan }) | null> {
    return await prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
      include: { plan: true },
    });
  }

  async upsertSubscription(data: Partial<Subscription>): Promise<Subscription> {
    return await prisma.subscription.upsert({
      where: { userId: data.userId },
      update: data,
      create: data as any,
    });
  }

  async updateSubscriptionStatus(
    stripeSubscriptionId: string,
    status: SubscriptionStatus
  ) {
    return await prisma.subscription.update({
      where: { stripeSubscriptionId },
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
    }
  ) {
    return await prisma.subscription.update({
      where: { stripeSubscriptionId },
      data,
    });
  }
}

export const subscriptionService = new SubscriptionService();
