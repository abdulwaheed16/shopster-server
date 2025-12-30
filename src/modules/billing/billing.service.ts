import Stripe from "stripe";
import { ApiError } from "../../common/errors/api-error";
import { comparePassword } from "../../common/utils/hash.util";
import { prisma } from "../../config/database.config";
import {
  CreateCheckoutSessionInput,
  CreatePortalSessionInput,
  UpdateCustomPlanInput,
} from "./billing.validation";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any,
});

// Helper type for Stripe subscriptions with period fields (moved/renamed in latest SDK types)
type StripeSubscriptionWithPeriod = any; // Using any for simplicity due to large structural changes in SDK types

export class BillingService {
  // Sync plans from database to Stripe (or vice versa) - Manual process or on startup
  async syncPlans() {
    // This could be used to ensure Stripe Prices exist for our DB plans
    const plans = await prisma.plan.findMany({ where: { isActive: true } });
    return plans;
  }

  // Create Checkout Session
  async createCheckoutSession(
    userId: string,
    data: CreateCheckoutSessionInput
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) throw ApiError.notFound("User not found");

    const plan = await prisma.plan.findUnique({
      where: { id: data.planId },
    });

    if (!plan || !plan.priceId) {
      throw ApiError.badRequest(
        "Invalid plan or plan not available for public checkout"
      );
    }

    // 1. Get or Create Stripe Customer
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: user.id },
      });
      stripeCustomerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
    }

    // 2. Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url:
        data.successUrl ||
        `${process.env.FRONTEND_URL}/dashboard/billing?success=true`,
      cancel_url:
        data.cancelUrl ||
        `${process.env.FRONTEND_URL}/dashboard/billing?canceled=true`,
      metadata: {
        userId: user.id,
        planId: plan.id,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planId: plan.id,
        },
      },
    });

    return { url: session.url };
  }

  // Create Portal Session
  async createPortalSession(userId: string, data: CreatePortalSessionInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.stripeCustomerId) {
      throw ApiError.badRequest(
        "No active billing record found. Please subscribe first."
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url:
        data.returnUrl || `${process.env.FRONTEND_URL}/dashboard/settings`,
    });

    return { url: session.url };
  }

  // Handle Stripe Webhooks
  async handleWebhook(signature: string, payload: Buffer) {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
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
      // Add more events as needed
    }

    return { received: true };
  }

  // Provisioning after checkout
  private async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;
    const stripeSubscriptionId = session.subscription as string;

    if (!userId || !planId) return;

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return;

    const stripeSub = (await stripe.subscriptions.retrieve(
      stripeSubscriptionId
    )) as StripeSubscriptionWithPeriod;

    await prisma.$transaction([
      prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          planId,
          stripeSubscriptionId,
          status: stripeSub.status.toUpperCase() as any,
          currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        },
        update: {
          planId,
          stripeSubscriptionId,
          status: stripeSub.status.toUpperCase() as any,
          currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        },
      }),
      // Initial credit grant
      prisma.user.update({
        where: { id: userId },
        data: {
          credits: { increment: plan.creditsPerMonth },
        },
      }),
      prisma.usageRecord.create({
        data: {
          userId,
          type: "MONTHLY_REFILL",
          creditAmount: plan.creditsPerMonth,
          description: `Initial credits for ${plan.name} plan`,
        },
      }),
    ]);
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    const inv = invoice as any;
    if (inv.billing_reason === "subscription_cycle") {
      let stripeSubscriptionId: string | undefined;

      if (typeof inv.subscription === "string") {
        stripeSubscriptionId = inv.subscription;
      } else if (inv.subscription && typeof inv.subscription === "object") {
        stripeSubscriptionId = (inv.subscription as any).id;
      }

      if (!stripeSubscriptionId) return;

      const sub = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId },
        include: { plan: true },
      });

      if (sub) {
        const stripeSub = (await stripe.subscriptions.retrieve(
          stripeSubscriptionId
        )) as any;

        // Refill credits and update period on recurring payment
        await prisma.$transaction([
          prisma.subscription.update({
            where: { stripeSubscriptionId },
            data: {
              status: stripeSub.status.toUpperCase() as any,
              currentPeriodStart: new Date(
                stripeSub.current_period_start * 1000
              ),
              currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            },
          }),
          prisma.user.update({
            where: { id: sub.userId },
            data: { credits: { increment: sub.plan.creditsPerMonth } },
          }),
          prisma.usageRecord.create({
            data: {
              userId: sub.userId,
              type: "MONTHLY_REFILL",
              creditAmount: sub.plan.creditsPerMonth,
              description: `Monthly credit refill for ${sub.plan.name}`,
            },
          }),
        ]);
      }
    }
  }

  private async handleSubscriptionChange(stripeSub: any) {
    const stripeSubscriptionId = stripeSub.id;

    // If subscription is deleted or canceled via status
    if (
      stripeSub.status === "canceled" ||
      ("deleted" in stripeSub && stripeSub.deleted)
    ) {
      await prisma.subscription.update({
        where: { stripeSubscriptionId },
        data: { status: "CANCELED" },
      });
      return;
    }

    const sub = stripeSub as StripeSubscriptionWithPeriod;

    await prisma.subscription.update({
      where: { stripeSubscriptionId },
      data: {
        status: sub.status.toUpperCase() as any,
        currentPeriodStart: sub.current_period_start
          ? new Date(sub.current_period_start * 1000)
          : undefined,
        currentPeriodEnd: sub.current_period_end
          ? new Date(sub.current_period_end * 1000)
          : undefined,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
    });
  }

  // Admin: Update Custom Plan
  async updateCustomPlan(adminId: string, data: UpdateCustomPlanInput) {
    // 1. Verify Admin Password (Secondary Layer)
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || !admin.password)
      throw ApiError.unauthorized("Admin authorization required");

    const isPasswordValid = await comparePassword(
      data.adminPassword,
      admin.password
    );
    if (!isPasswordValid)
      throw ApiError.unauthorized(
        "Invalid admin password. Authorization failed."
      );

    // 2. Find or Create "Custom" Plan Entry
    let customPlan = await prisma.plan.findUnique({
      where: { name: "Custom" },
    });
    if (!customPlan) {
      customPlan = await prisma.plan.create({
        data: {
          name: "Custom",
          creditsPerMonth: 0, // Base
          storesLimit: 0, // Base
          isActive: false, // Not for public selection
        },
      });
    }

    // 3. Upsert Subscription for user with custom overrides
    // Note: In a real system, we might want a "CustomSubscription" or flags.
    // Here we'll just update the user's current subscription or create one.

    await prisma.$transaction([
      prisma.subscription.upsert({
        where: { userId: data.userId },
        create: {
          userId: data.userId,
          planId: customPlan.id,
          status: "ACTIVE",
        },
        update: {
          planId: customPlan.id,
          status: "ACTIVE",
        },
      }),
      prisma.user.update({
        where: { id: data.userId },
        data: {
          credits: data.credits,
        },
      }),
      prisma.usageRecord.create({
        data: {
          userId: data.userId,
          type: "ADMIN_ADJUSTMENT",
          creditAmount: data.credits,
          description: `Admin manual adjustment for custom plan`,
        },
      }),
    ]);

    return { message: "Custom plan updated successfully" };
  }

  // Usage Tracking: Check and deduct credits
  async checkAndDeductCredits(
    userId: string,
    amount: number,
    type: any,
    description?: string
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound("User not found");

    if (user.credits < amount) {
      throw ApiError.badRequest(
        "Insufficient credits for this operation. Please upgrade your plan."
      );
    }

    return await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: amount } },
      }),
      prisma.usageRecord.create({
        data: {
          userId,
          type,
          creditAmount: -amount,
          description,
        },
      }),
    ]);
  }
}

export const billingService = new BillingService();
