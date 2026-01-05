import Stripe from "stripe";
import { IPaymentGateway } from "./billing.types";

export class StripeService implements IPaymentGateway {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-01-27.acacia" as any,
    });
  }

  async createCustomer(
    email: string,
    name?: string,
    metadata?: Stripe.Metadata
  ) {
    return await this.stripe.customers.create({
      email,
      name,
      metadata,
    });
  }

  async createCheckoutSession(params: Stripe.Checkout.SessionCreateParams) {
    return await this.stripe.checkout.sessions.create(params);
  }

  async createPortalSession(customerId: string, returnUrl: string) {
    return await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  async retrieveSubscription(id: string) {
    return await this.stripe.subscriptions.retrieve(id);
  }

  async cancelSubscription(subscriptionId: string, immediate: boolean = false) {
    if (immediate) {
      return await this.stripe.subscriptions.cancel(subscriptionId);
    }
    return await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  async listInvoices(customerId: string, limit: number = 10) {
    return await this.stripe.invoices.list({
      customer: customerId,
      limit,
    });
  }

  async listPaymentMethods(customerId: string) {
    return await this.stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });
  }

  async updateSubscription(
    subscriptionId: string,
    params: Stripe.SubscriptionUpdateParams
  ) {
    return await this.stripe.subscriptions.update(subscriptionId, params);
  }

  constructEvent(payload: Buffer, signature: string, secret: string) {
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }
}

export const stripeService = new StripeService();
