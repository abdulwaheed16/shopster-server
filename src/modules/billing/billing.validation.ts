import { z } from "zod";

export const createCheckoutSessionSchema = z.object({
  body: z.object({
    planId: z.string().nonempty("Plan ID is required"),
    successUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional(),
  }),
});

export const createPortalSessionSchema = z.object({
  body: z.object({
    returnUrl: z.string().url().optional(),
  }),
});

export const updateCustomPlanSchema = z.object({
  body: z.object({
    userId: z.string().nonempty("User ID is required"),
    credits: z.number().int().min(0, "Credits must be a positive number"),
    storesLimit: z.number().int().min(1, "Stores limit must be at least 1"),
    adminPassword: z
      .string()
      .nonempty("Admin password is required for billing overrides"),
    isActive: z.boolean().optional(),
    features: z.record(z.any(), z.any()).optional(),
  }),
});

export type CreateCheckoutSessionInput = z.infer<
  typeof createCheckoutSessionSchema
>["body"];
export type CreatePortalSessionInput = z.infer<
  typeof createPortalSessionSchema
>["body"];
export type UpdateCustomPlanInput = z.infer<
  typeof updateCustomPlanSchema
>["body"];
