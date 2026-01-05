import { z } from "zod";
import { objectIdSchema } from "../../common/validations/common.validation";

// Generate ad schema
export const generateAdSchema = z.object({
  body: z.object({
    productId: objectIdSchema,
    templateId: objectIdSchema,
    title: z.string().optional(),
    variableValues: z.record(z.string(), z.any()), // JSON object
    aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:5"]).optional(),
    variantsCount: z.number().int().min(1).max(4).optional(),
  }),
});

// Get ads query schema
export const getAdsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]).optional(),
    productId: objectIdSchema.optional(),
    templateId: objectIdSchema.optional(),
  }),
});

export type GenerateAdBody = z.infer<typeof generateAdSchema>["body"];
export type GetAdsQuery = z.infer<typeof getAdsSchema>["query"];

// Bulk delete ads schema
export const bulkDeleteAdsSchema = z.object({
  body: z.object({
    ids: z.array(objectIdSchema).min(1, "At least one ad ID is required"),
  }),
});

export type BulkDeleteAdsBody = z.infer<typeof bulkDeleteAdsSchema>["body"];
