import {
  Plan,
  Subscription,
  SubscriptionStatus,
  UsageType,
} from "@prisma/client";
import Stripe from "stripe";

export interface IPaymentGateway {
  createCustomer(
    email: string,
    name?: string,
    metadata?: Stripe.Metadata,
  ): Promise<Stripe.Customer>;
  createCheckoutSession(
    params: Stripe.Checkout.SessionCreateParams,
  ): Promise<Stripe.Checkout.Session>;
  createPortalSession(
    customerId: string,
    returnUrl: string,
  ): Promise<Stripe.BillingPortal.Session>;
  constructEvent(
    payload: Buffer,
    signature: string,
    secret: string,
  ): Stripe.Event;
  retrieveSubscription(id: string): Promise<Stripe.Subscription>;
  cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription>;
}

export interface ICreditManager {
  addCredits(
    userId: string,
    creditAmount: number,
    type: UsageType,
    description?: string,
  ): Promise<unknown>;
  deductCredits(
    userId: string,
    creditAmount: number,
    type: UsageType,
    description?: string,
  ): Promise<unknown>;
  setCredits(
    userId: string,
    creditAmount: number,
    description: string,
  ): Promise<unknown>;
}

export interface ISubscriptionService {
  getSubscriptionByUserId(
    userId: string,
  ): Promise<(Subscription & { plan: Plan }) | null>;
  getSubscriptionByStripeId(
    stripeSubscriptionId: string,
  ): Promise<(Subscription & { plan: Plan }) | null>;
  upsertSubscription(data: Partial<Subscription>): Promise<Subscription>;
  updateSubscriptionStatus(
    stripeSubscriptionId: string,
    status: SubscriptionStatus,
  ): Promise<Subscription | null>;
  updateSubscriptionPeriod(
    stripeSubscriptionId: string,
    data: {
      currentPeriodEnd: Date;
      currentPeriodStart: Date;
      status?: SubscriptionStatus;
      cancelAtPeriodEnd?: boolean;
    },
  ): Promise<Subscription | null>;
}
