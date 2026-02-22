import { z } from "zod";
import { objectIdSchema } from "../../common/validations/common.validation";

// ─── Checkout & Portal ───────────────────────────────────────────────────────

export const createCheckoutSessionSchema = z.object({
  body: z.object({
    planId: objectIdSchema,
    interval: z.enum(["MONTHLY", "YEARLY"]).optional(),
    currency: z.enum(["USD", "PKR"]).optional(),
    successUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional(),
  }),
});

export const createPortalSessionSchema = z.object({
  body: z.object({
    returnUrl: z.string().url().optional(),
  }),
});

// ─── Admin: Plan CRUD ─────────────────────────────────────────────────────────

const planPriceSchema = z.object({
  currency: z.enum(["USD", "PKR"]),
  interval: z.enum(["MONTHLY", "YEARLY"]),
  amount: z.number().min(0),
  stripePriceId: z.string().optional(),
});

export const createPlanSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    slug: z
      .string()
      .min(1, "Slug is required")
      .regex(
        /^[a-z0-9-]+$/,
        "Slug must be lowercase alphanumeric with hyphens",
      ),
    type: z.enum(["FREE", "STARTER", "PRO", "BUSINESS", "PAYG", "CUSTOM"]),
    description: z.string().optional(),
    prices: z.array(planPriceSchema).min(1, "At least one price is required"),
    yearlyDiscountPct: z.number().min(0).max(100).optional(),
    creditsPerMonth: z.number().min(0, "Credits must be non-negative"),
    storesLimit: z.number().int().min(0, "Stores limit must be non-negative"),
    features: z
      .union([z.record(z.string(), z.unknown()), z.array(z.string())])
      .optional(),
    isActive: z.boolean().optional(),
    isPublic: z.boolean().optional(),
  }),
});

export const updatePlanSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    name: z.string().min(1).optional(),
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    type: z
      .enum(["FREE", "STARTER", "PRO", "BUSINESS", "PAYG", "CUSTOM"])
      .optional(),
    description: z.string().optional(),
    prices: z.array(planPriceSchema).optional(),
    yearlyDiscountPct: z.number().min(0).max(100).optional(),
    creditsPerMonth: z.number().min(0).optional(),
    storesLimit: z.number().int().min(0).optional(),
    features: z
      .union([z.record(z.string(), z.unknown()), z.array(z.string())])
      .optional(),
    isActive: z.boolean().optional(),
    isPublic: z.boolean().optional(),
  }),
});

// ─── Admin: Subscription CRUD ─────────────────────────────────────────────────

export const createSubscriptionSchema = z.object({
  body: z.object({
    userId: objectIdSchema,
    planId: objectIdSchema,
    interval: z.enum(["MONTHLY", "YEARLY"]).optional(),
    status: z
      .enum([
        "ACTIVE",
        "PAST_DUE",
        "CANCELED",
        "INCOMPLETE",
        "TRIALING",
        "PAUSED",
      ])
      .optional(),
    currentPeriodStart: z.string().datetime().optional(),
    currentPeriodEnd: z.string().datetime().optional(),
    stripeSubscriptionId: z.string().optional(),
  }),
});

export const updateSubscriptionSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    planId: objectIdSchema.optional(),
    interval: z.enum(["MONTHLY", "YEARLY"]).optional(),
    status: z
      .enum([
        "ACTIVE",
        "PAST_DUE",
        "CANCELED",
        "INCOMPLETE",
        "TRIALING",
        "PAUSED",
        "UNPAID",
        "INCOMPLETE_EXPIRED",
      ])
      .optional(),
    currentPeriodStart: z.string().datetime().optional(),
    currentPeriodEnd: z.string().datetime().optional(),
    cancelAtPeriodEnd: z.boolean().optional(),
    pendingPlanId: objectIdSchema.optional().nullable(),
    stripeSubscriptionId: z.string().optional().nullable(),
  }),
});

// ─── Admin: Credit Adjustment ─────────────────────────────────────────────────

export const adjustCreditsSchema = z.object({
  params: z.object({ userId: objectIdSchema }),
  body: z.object({
    creditAmount: z.number(),
    type: z
      .enum(["ADMIN_ADJUSTMENT", "MONTHLY_REFILL", "TOPUP_PURCHASE", "REFUND"])
      .optional(),
    description: z.string().optional(),
  }),
});
// ─── Admin: Custom Plan Updates ─────────────────────────────────────────────

export const updateCustomPlanSchema = z.object({
  body: z.object({
    userId: objectIdSchema,
    name: z.string().optional(),
    description: z.string().optional(),
    creditsPerMonth: z
      .number()
      .int()
      .min(0, "Credits must be a positive number")
      .optional(),
    storesLimit: z
      .number()
      .int()
      .min(1, "Stores limit must be at least 1")
      .optional(),
    isActive: z.boolean().optional(),
    features: z.record(z.string(), z.unknown()).optional(),
  }),
});

export const verifyPasswordSchema = z.object({
  body: z.object({
    password: z.string().min(1, "Password is required"),
  }),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateCheckoutSessionBody = z.infer<
  typeof createCheckoutSessionSchema
>["body"];
export type CreatePortalSessionBody = z.infer<
  typeof createPortalSessionSchema
>["body"];
export type CreatePlanBody = z.infer<typeof createPlanSchema>["body"];
export type UpdatePlanBody = z.infer<typeof updatePlanSchema>["body"];
export type UpdateCustomPlanBody = z.infer<
  typeof updateCustomPlanSchema
>["body"];
export type VerifyPasswordBody = z.infer<typeof verifyPasswordSchema>["body"];
export type CreateSubscriptionBody = z.infer<
  typeof createSubscriptionSchema
>["body"];
export type UpdateSubscriptionBody = z.infer<
  typeof updateSubscriptionSchema
>["body"];
export type AdjustCreditsBody = z.infer<typeof adjustCreditsSchema>["body"];
