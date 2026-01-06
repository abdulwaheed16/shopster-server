import Stripe from "stripe";
import { ApiError } from "../../common/errors/api-error";
type Plan = any;
type BillingInterval = any;

/**
 * Interface for checkout line item strategies (SOLID: Dependency Inversion & Strategy Pattern)
 */
export interface ICheckoutItemStrategy {
  canHandle(plan: Plan): boolean;
  createLineItem(
    plan: Plan,
    interval?: BillingInterval
  ): Stripe.Checkout.SessionCreateParams.LineItem;
}

/**
 * Strategy for plans that already have a pre-defined Stripe Price ID (SOLID: Single Responsibility)
 */
export class ExistingPriceStrategy implements ICheckoutItemStrategy {
  canHandle(plan: Plan): boolean {
    return !!plan.priceId;
  }

  createLineItem(plan: Plan): Stripe.Checkout.SessionCreateParams.LineItem {
    return {
      price: plan.priceId!,
      quantity: 1,
    };
  }
}

/**
 * Strategy for creating a price on-the-fly (ad-hoc) using plan details (SOLID: Open/Closed)
 */
export class AdHocPriceStrategy implements ICheckoutItemStrategy {
  canHandle(plan: Plan): boolean {
    // We can handle it if priceId is missing but we have a base price
    return !plan.priceId && plan.price !== null && plan.price !== undefined;
  }

  createLineItem(
    plan: Plan,
    requestedInterval?: BillingInterval
  ): Stripe.Checkout.SessionCreateParams.LineItem {
    const activeInterval = requestedInterval || plan.billingInterval;
    const intervalStr = activeInterval.toLowerCase();

    // Stripe expects day, month, week, or year. Our enum is MONTHLY, YEARLY.
    const stripeInterval = intervalStr === "monthly" ? "month" : "year";

    // 20% discount for Yearly
    let amount = plan.price || 0;
    if (activeInterval === "YEARLY") {
      amount = amount * 12 * 0.8; // 20% OFF on yearly subscription
      // 99 * 12 = 1188
      // 1188 * 0.8 = 950.4
    }
    // Build a feature list for the checkout page
    const features = plan.features as Record<string, any>;
    const featureList = features
      ? Object.entries(features)
          .map(([k, v]) => `- ${k.replace(/([A-Z])/g, " $1")}: ${v}`)
          .join("\n")
      : "";

    const fullDescription = [
      plan.description,
      `• ${plan.creditsPerMonth} Creative Credits/mo`,
      `• ${
        plan.storesLimit >= 9999 ? "Unlimited" : plan.storesLimit
      } Store Syncs`,
      featureList,
    ]
      .filter(Boolean)
      .join("\n");

    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: `${plan.name} (${activeInterval})`,
          description: fullDescription.slice(0, 500), // Stripe limit
          metadata: {
            planId: plan.id,
            interval: activeInterval,
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

  resolve(plan: Plan): ICheckoutItemStrategy {
    const strategy = this.strategies.find((s) => s.canHandle(plan));
    if (!strategy) {
      throw ApiError.badRequest(
        `No checkout strategy found for plan: ${plan.name}. This plan might require manual admin setup.`
      );
    }
    return strategy;
  }
}

// Export a default instance with standard strategies
export const checkoutItemResolver = new CheckoutItemResolver([
  new ExistingPriceStrategy(),
  new AdHocPriceStrategy(),
]);
