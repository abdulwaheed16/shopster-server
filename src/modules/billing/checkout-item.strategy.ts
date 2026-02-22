import { BillingInterval } from "@prisma/client";
import Stripe from "stripe";
import { ApiError } from "../../common/errors/api-error";

/**
 * Interface for checkout line item strategies (SOLID: Dependency Inversion & Strategy Pattern)
 */
export interface ICheckoutItemStrategy {
  canHandle(plan: any, interval?: BillingInterval): boolean;
  createLineItem(
    plan: any,
    interval?: BillingInterval,
  ): Stripe.Checkout.SessionCreateParams.LineItem;
}

/**
 * Strategy for plans that already have a pre-defined Stripe Price ID in the prices array
 */
export class ExistingPriceStrategy implements ICheckoutItemStrategy {
  canHandle(plan: any, requestedInterval?: BillingInterval): boolean {
    const interval = requestedInterval || "MONTHLY";
    // Find price for the requested interval that has a Stripe Price ID
    return plan.prices?.some(
      (p: any) => p.interval === interval && !!p.stripePriceId,
    );
  }

  createLineItem(
    plan: any,
    requestedInterval?: BillingInterval,
  ): Stripe.Checkout.SessionCreateParams.LineItem {
    const interval = requestedInterval || "MONTHLY";
    const price = plan.prices?.find((p: any) => p.interval === interval);

    if (!price?.stripePriceId) {
      throw ApiError.badRequest(
        `No Stripe Price ID found for ${plan.name} (${interval})`,
      );
    }

    return {
      price: price.stripePriceId,
      quantity: 1,
    };
  }
}

/**
 * Strategy for creating a price on-the-fly (ad-hoc) using base amount from prices array
 */
export class AdHocPriceStrategy implements ICheckoutItemStrategy {
  canHandle(plan: any, requestedInterval?: BillingInterval): boolean {
    const interval = requestedInterval || "MONTHLY";
    const price = plan.prices?.find((p: any) => p.interval === interval);
    return !!price && !price.stripePriceId && typeof price.amount === "number";
  }

  createLineItem(
    plan: any,
    requestedInterval?: BillingInterval,
    currency: string = "usd",
  ): Stripe.Checkout.SessionCreateParams.LineItem {
    const interval = requestedInterval || "MONTHLY";
    const priceEntry = plan.prices?.find(
      (p: any) =>
        p.interval === interval &&
        p.currency.toLowerCase() === currency.toLowerCase(),
    );

    if (!priceEntry) {
      throw ApiError.badRequest(
        `No price found for ${plan.name} in ${currency} (${interval})`,
      );
    }

    const stripeInterval = interval === "MONTHLY" ? "month" : "year";
    const amount = priceEntry.amount;

    // Build feature list as before
    const features = plan.features as Record<string, any>;
    const featureList = features
      ? Object.entries(features)
          .map(([k, v]) => `- ${k.replace(/([A-Z])/g, " $1")}: ${v}`)
          .join("\n")
      : "";

    const fullDescription = [
      plan.description,
      `• ${plan.creditsPerMonth} Creative Credits/mo`,
      `• ${plan.storesLimit >= 9999 ? "Unlimited" : plan.storesLimit} Store Syncs`,
      featureList,
    ]
      .filter(Boolean)
      .join("\n");

    return {
      price_data: {
        currency: currency.toLowerCase(),
        product_data: {
          name: `${plan.name} (${interval})`,
          description: fullDescription.slice(0, 500),
          metadata: {
            planId: plan.id,
            interval: interval,
          },
        },
        unit_amount: Math.round(amount * 100),
        recurring: {
          interval:
            stripeInterval as Stripe.Checkout.SessionCreateParams.LineItem.PriceData.Recurring.Interval,
        },
      },
      quantity: 1,
    };
  }
}

/**
 * Resolver for checkout strategies (SOLID: Interface Segregation & Factory-like logic)
 */
export class CheckoutItemResolver {
  private strategies: ICheckoutItemStrategy[];

  constructor(strategies: ICheckoutItemStrategy[]) {
    this.strategies = strategies;
  }

  resolve(plan: any, interval?: BillingInterval): ICheckoutItemStrategy {
    const strategy = this.strategies.find((s) => s.canHandle(plan, interval));
    if (!strategy) {
      throw ApiError.badRequest(
        `No checkout strategy found for plan: ${plan.name} (${interval || "MONTHLY"}).`,
      );
    }
    return strategy;
  }
}

export const checkoutItemResolver = new CheckoutItemResolver([
  new ExistingPriceStrategy(),
  new AdHocPriceStrategy(),
]);
