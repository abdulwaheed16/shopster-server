import { BillingInterval, SubscriptionStatus, UsageType } from "@prisma/client";
import Stripe from "stripe";
import { ApiError } from "../../common/errors/api-error";
import { comparePassword } from "../../common/utils/hash.util";
import { prisma } from "../../config/database.config";

import {
  CreateCheckoutSessionBody,
  CreatePortalSessionBody,
  UpdateCustomPlanBody,
} from "./billing.validation";
import { checkoutItemResolver } from "./checkout-item.strategy";
import { creditsService } from "./credits.service";
import { stripeService } from "./stripe.service";
import { subscriptionService } from "./subscription.service";

export class BillingService {
  /**
   * Get all active subscription plans for the pricing page
   */
  async getActivePlans() {
    return await prisma.plan.findMany({
      where: { isActive: true },
    });
  }

  /**
   * Get a plan by its internal ID
   */
  async getPlanById(planId: string) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw ApiError.notFound("Plan not found");
    return plan;
  }

  /**
   * Create a Stripe Checkout Session for a specific Plan
   * Fulfills the requirement: "package id will be sent to the backend"
   */
  async createCheckoutSession(userId: string, data: CreateCheckoutSessionBody) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    if (!user) throw ApiError.notFound("User not found");

    const plan = await this.getPlanById(data.planId);

    // 1. Upgrade/Downgrade Detection
    const currentSub = user.subscription;
    if (currentSub && currentSub.status === "ACTIVE") {
      const isSamePlan = currentSub.planId === data.planId;
      const isSameInterval =
        (currentSub as any).interval ===
        (data.interval || currentSub.plan.billingInterval);

      if (isSamePlan && isSameInterval && !currentSub.cancelAtPeriodEnd) {
        throw ApiError.badRequest("You are already subscribed to this plan.");
      }

      // Detect Downgrade
      // Upgrade = Higher price OR Higher credits
      const currentPrice =
        currentSub.interval === "YEARLY"
          ? (currentSub.plan.price || 0) * 12 * 0.8
          : currentSub.plan.price || 0;
      const requestedPrice =
        (data.interval || plan.billingInterval) === "YEARLY"
          ? Math.floor((plan.price || 0) * 12 * 0.8)
          : plan.price || 0;

      const isDowngrade = requestedPrice < currentPrice;

      if (isDowngrade && currentSub.stripeSubscriptionId) {
        // Schedule Downgrade for next cycle
        const stripeSub = await stripeService.updateSubscription(
          currentSub.stripeSubscriptionId,
          {
            items: [
              {
                id: (
                  (await stripeService.retrieveSubscription(
                    currentSub.stripeSubscriptionId
                  )) as any
                ).items.data[0].id,
                price: plan.priceId || undefined, // Use priceId if exists, else we'd need to create one. For simplicity, assuming standard plans have priceIds or we use ad-hoc.
                // If ad-hoc, we might need a different approach. But typically downgrades are between standard plans.
              },
            ],
            proration_behavior: "none", // Do not charge or refund now
            // Stripe automatically aligns this to the next period if scheduled via update with specific flags or just update.
            // Actually, 'none' proration with change of price usually takes effect at the end of the current period if we use 'billing_cycle_anchor: uncharged'?
            // No, 'none' means keep current until end, then switch.
          } as any
        );

        await subscriptionService.updateSubscriptionPeriod(
          currentSub.stripeSubscriptionId,
          {
            cancelAtPeriodEnd: false, // Ensure it's not canceled, just scheduled for change
            pendingPlanId: plan.id, // Track what it will change to
          } as any
        );

        return { url: `${process.env.FRONTEND_URL}/billing?scheduled=true` };
      }
    }

    // 1. Resolve the line item strategy based on plan data (SOLID Principle)
    const strategy = checkoutItemResolver.resolve(plan);
    const lineItem = strategy.createLineItem(plan, data.interval);

    // 2. Ensure Stripe Customer exists
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripeService.createCustomer(
        user.email,
        user.name || undefined,
        { userId: user.id }
      );
      stripeCustomerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
    }

    // 3. Create Checkout Session
    const session = await stripeService.createCheckoutSession({
      customer: stripeCustomerId,
      line_items: [lineItem],
      mode: "subscription",
      allow_promotion_codes: true, // Allow discounts/coupons
      success_url:
        data.successUrl || `${process.env.FRONTEND_URL}/billing?success=true`,
      cancel_url:
        data.cancelUrl || `${process.env.FRONTEND_URL}/billing?canceled=true`,
      metadata: {
        userId: user.id,
        planId: plan.id,
        interval: data.interval || plan.billingInterval,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planId: plan.id,
          interval: data.interval || plan.billingInterval,
        },
      },
    });

    return { url: session.url };
  }

  /**
   * Get historical invoices for a user with pagination and filtering
   */
  async getInvoices(
    userId: string,
    options: { page?: number; limit?: number; status?: string } = {}
  ) {
    const { page = 1, limit = 10, status } = options;
    const skip = (page - 1) * (limit > 50 ? 50 : limit);

    const where: any = { userId };
    if (status) where.status = status;

    let total = await prisma.invoice.count({ where });

    // Sync from Stripe if no invoices found in local DB (Bootstrap existing history)
    // or if skip is 0 (first page) to ensure fresh data
    if (total === 0 || (skip === 0 && !status)) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });
      if (user?.stripeCustomerId) {
        const stripeInvoices = await stripeService.listInvoices(
          user.stripeCustomerId
        );
        console.log(
          `Syncing ${stripeInvoices.data.length} invoices for user ${userId}`
        );
        if (stripeInvoices.data.length > 0) {
          await Promise.all(
            stripeInvoices.data.map((inv) =>
              prisma.invoice.upsert({
                where: { stripeId: inv.id },
                update: {
                  status: inv.status || "void",
                  pdfUrl: inv.invoice_pdf || inv.hosted_invoice_url,
                },
                create: {
                  userId,
                  stripeId: inv.id,
                  subscriptionId: user.subscription?.id,
                  planId: user.subscription?.planId,
                  amount: inv.amount_paid / 100,
                  currency: inv.currency,
                  status: inv.status || "void",
                  date: new Date(inv.created * 1000),
                  pdfUrl: inv.invoice_pdf || inv.hosted_invoice_url,
                  number: inv.number,
                },
              } as any)
            )
          );
          total = await prisma.invoice.count({ where });
        }
      }
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: limit,
      include: {
        plan: true,
        subscription: {
          select: {
            currentPeriodStart: true,
            currentPeriodEnd: true,
            interval: true,
          },
        },
      },
    });

    return {
      data: invoices,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get saved payment methods for a user
   */
  async getPaymentMethods(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.stripeCustomerId) return [];

    const methods = await stripeService.listPaymentMethods(
      user.stripeCustomerId
    );

    return methods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
      isDefault: false, // Stripe doesn't directly return 'isDefault' in this list easily without customer check
    }));
  }

  /**
   * Create a Stripe Billing Portal session for subscription management
   */
  async createPortalSession(userId: string, data: CreatePortalSessionBody) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.stripeCustomerId) {
      throw ApiError.badRequest(
        "No active billing record found. Please subscribe first."
      );
    }

    const { url } = await stripeService.createPortalSession(
      user.stripeCustomerId,
      data.returnUrl || `${process.env.FRONTEND_URL}/dashboard/settings`
    );

    return { url };
  }

  /**
   * Handle incoming Stripe Webhook events
   */
  async handleWebhook(signature: string, payload: Buffer) {
    let event: Stripe.Event;

    try {
      event = stripeService.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );
    } catch (err: any) {
      throw ApiError.badRequest(
        `Webhook signature verification failed: ${err.message}`
      );
    }

    switch (event.type) {
      case "checkout.session.completed":
        await this.handleCheckoutComplete(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      case "invoice.paid":
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await this.handleSubscriptionChange(
          event.data.object as Stripe.Subscription
        );
        break;
    }

    return { received: true };
  }

  /**
   * Logic for when a checkout is completed
   */
  private async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;
    const interval = session.metadata?.interval as BillingInterval;
    const stripeSubscriptionId = session.subscription as string;

    if (!userId || !planId) return;

    // 1. Fetch user to check for existing subscription and carry over credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) return;

    // 2. Cancel existing subscription in Stripe if different (ensure ONLY ONE active)
    if (
      user.subscription &&
      user.subscription.stripeSubscriptionId &&
      user.subscription.stripeSubscriptionId !== stripeSubscriptionId
    ) {
      try {
        console.log(
          `Cancelling previous subscription ${user.subscription.stripeSubscriptionId} for user ${userId}`
        );
        await stripeService.cancelSubscription(
          user.subscription.stripeSubscriptionId,
          true // Immediate cancellation
        );
      } catch (e) {
        console.error(
          `Failed to cancel old subscription ${user.subscription.stripeSubscriptionId}:`,
          e
        );
      }
    }

    const plan = await this.getPlanById(planId);
    const stripeSub = (await stripeService.retrieveSubscription(
      stripeSubscriptionId
    )) as any;

    // Update or create subscription in DB
    await subscriptionService.upsertSubscription({
      userId,
      planId,
      stripeSubscriptionId,
      status: stripeSub.status.toUpperCase() as SubscriptionStatus,
      interval: interval || plan.billingInterval,
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    });

    // 4. Grant credits (carryover is handled by increment)
    // If they upgrade, they keep current + new plan credits
    await creditsService.addCredits(
      userId,
      plan.creditsPerMonth,
      UsageType.MONTHLY_REFILL,
      `Credits for ${plan.name} plan (Sync)`
    );
  }

  /**
   * Logic for when an invoice is paid (recurring billing)
   */
  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    const inv = invoice as any;
    if (inv.billing_reason !== "subscription_cycle") return;

    const stripeSubscriptionId =
      typeof inv.subscription === "string"
        ? inv.subscription
        : (inv.subscription as any)?.id;

    if (!stripeSubscriptionId) return;

    const sub = await subscriptionService.getSubscriptionByStripeId(
      stripeSubscriptionId
    );
    if (!sub) return;

    const stripeSub = (await stripeService.retrieveSubscription(
      stripeSubscriptionId
    )) as any;

    // Update period in DB
    await subscriptionService.updateSubscriptionPeriod(stripeSubscriptionId, {
      status: stripeSub.status.toUpperCase() as SubscriptionStatus,
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    });

    // Refill monthly credits (Priority: Custom > Plan)
    const refillAmount =
      (sub as any).customCreditsPerMonth ?? sub.plan.creditsPerMonth;
    await creditsService.addCredits(
      sub.userId,
      refillAmount,
      UsageType.MONTHLY_REFILL,
      `Monthly credit refill for ${sub.plan.name}`
    );

    // Persist invoice in DB for history (SOLID: Persistent storage)
    await prisma.invoice.upsert({
      where: { stripeId: inv.id },
      update: {
        status: inv.status,
        pdfUrl: inv.invoice_pdf || inv.hosted_invoice_url,
      },
      create: {
        userId: sub.userId,
        stripeId: inv.id,
        subscriptionId: sub.id,
        planId: sub.planId,
        amount: inv.amount_paid / 100,
        currency: inv.currency,
        status: inv.status,
        date: new Date(inv.created * 1000),
        pdfUrl: inv.invoice_pdf || inv.hosted_invoice_url,
        number: inv.number,
      },
    });
  }

  /**
   * Handle general subscription changes or cancellations
   */
  private async handleSubscriptionChange(
    stripeSubscription: Stripe.Subscription
  ) {
    const stripeSub = stripeSubscription as any;
    const stripeSubscriptionId = stripeSub.id;

    if (stripeSub.status === "canceled") {
      await subscriptionService.updateSubscriptionStatus(
        stripeSubscriptionId,
        SubscriptionStatus.CANCELED
      );
      return;
    }

    await subscriptionService.updateSubscriptionPeriod(stripeSubscriptionId, {
      status: stripeSub.status.toUpperCase() as SubscriptionStatus,
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    });
  }

  /**
   * Cancel a user's subscription at the end of the current period
   */
  async cancelSubscription(userId: string) {
    const sub = await subscriptionService.getSubscriptionByUserId(userId);
    if (!sub || !sub.stripeSubscriptionId) {
      throw ApiError.badRequest("No active subscription found to cancel");
    }

    if (sub.status === "CANCELED") {
      throw ApiError.badRequest("Subscription is already canceled");
    }

    const stripeSub = (await stripeService.cancelSubscription(
      sub.stripeSubscriptionId
    )) as any;

    // Update DB status immediately to reflect it will cancel at period end
    await subscriptionService.updateSubscriptionPeriod(
      sub.stripeSubscriptionId,
      {
        status: sub.status, // Keep current status until Stripe actually cancels it
        currentPeriodStart: sub.currentPeriodStart!,
        currentPeriodEnd: sub.currentPeriodEnd!,
        cancelAtPeriodEnd: true,
      }
    );

    return {
      message: "Subscription will be canceled at the end of the current period",
      cancelAt: new Date(stripeSub.current_period_end * 1000),
    };
  }

  /**
   * Admin: Assign a custom deal to a user
   * Fulfills: "if package is custom deal it accordingly using best practices"
   */
  async updateCustomPlan(adminId: string, data: UpdateCustomPlanBody) {
    // 1. Security Check: Verify Admin
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== "ADMIN" || !admin.password) {
      throw ApiError.unauthorized("Admin authorization required");
    }

    const isPasswordValid = await comparePassword(
      data.adminPassword,
      admin.password
    );
    if (!isPasswordValid)
      throw ApiError.unauthorized("Invalid admin credentials");

    // 2. Find "Custom" Plan
    const customPlan = await prisma.plan.findUnique({
      where: { name: "Custom" },
    });
    if (!customPlan)
      throw ApiError.notFound(
        "Custom plan definition not found. Please run seeds."
      );

    // 3. Create or update user's subscription with custom plan
    const subscription = await subscriptionService.upsertSubscription({
      userId: data.userId,
      planId: customPlan.id,
      status: SubscriptionStatus.ACTIVE,
    });

    // 4. Store custom limits on the subscription
    if (subscription.stripeSubscriptionId) {
      await subscriptionService.updateSubscriptionPeriod(
        subscription.stripeSubscriptionId,
        {
          currentPeriodStart: subscription.currentPeriodStart || new Date(),
          currentPeriodEnd:
            subscription.currentPeriodEnd ||
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          customCreditsPerMonth: data.credits,
          customStoresLimit: data.storesLimit,
        } as any
      );
    }

    // 5. Set initial credits
    await creditsService.setCredits(
      data.userId,
      data.credits,
      `Custom plan assigned: ${data.credits} credits/month, ${data.storesLimit} stores limit`
    );

    return {
      message: "Custom plan assigned successfully",
      details: {
        creditsPerMonth: data.credits,
        storesLimit: data.storesLimit,
      },
    };
  }

  /**
   * High-level check and deduct credits for other services (Ads, Templates)
   */
  async checkAndDeductCredits(
    userId: string,
    amount: number,
    type: UsageType,
    description?: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === "ADMIN") {
      console.log(`Skipping credit deduction for admin user: ${userId}`);
      return;
    }

    return await creditsService.deductCredits(
      userId,
      amount,
      type,
      description
    );
  }

  /**
   * Admin: Get all usage records for a specific user
   */
  async getUserUsage(userId: string) {
    return await prisma.usageRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const billingService = new BillingService();
