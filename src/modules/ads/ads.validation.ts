import { z } from "zod";
import { objectIdSchema } from "../../common/validations/common.validation";

// Shared base fields for all ad types
const baseAdSchema = z.object({
  products: z.array(
    z.object({
      productId: objectIdSchema,
      source: z.enum(["STORE", "UPLOADED"]),
    }),
  ),
  templateId: objectIdSchema.optional(),
  title: z.string().optional(),
  mediaType: z.enum(["IMAGE", "VIDEO"]).optional(),
  assembledPrompt: z.string().optional(),
  aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:5"]).optional(),
  variantsCount: z.number().int().min(1).max(4).optional(),
  variableValues: z.record(z.string(), z.any()).optional(),
  color: z.string().optional(),
});

// Image ad-specific fields
const imageAdSchema = baseAdSchema.extend({
  mediaType: z.literal("IMAGE"),
  prompt: z.string().optional(),
  templateImageUrl: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val))
    .pipe(z.string().url().optional()),
});

// Video ad-specific fields
const videoAdSchema = baseAdSchema.extend({
  mediaType: z.literal("VIDEO"),
  scenes: z.array(z.string()).optional(),
  duration: z.number().int().min(5).max(15).optional(),
  videoScript: z
    .object({
      type: z.enum(["TEXT", "VOICE"]),
      content: z.string().min(1, "Script content is required"),
    })
    .optional(),
  modelImageUrl: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val))
    .pipe(z.string().url().optional()),
});

// Discriminated union schema
export const generateAdSchema = z.object({
  body: z.discriminatedUnion("mediaType", [imageAdSchema, videoAdSchema]),
});

// Get ads query schema
export const getAdsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]).optional(),
    productId: objectIdSchema.optional(),
    templateId: objectIdSchema.optional(),
    storeId: objectIdSchema.optional(),
    search: z.string().optional(),
    sort: z.enum(["recent", "oldest"]).optional(),
    days: z.enum(["7", "30", "90", "all"]).optional(),
    cursor: z.string().optional(),
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

// n8n Callback schema
export const n8nCallbackSchema = z.object({
  body: z.object({
    adId: objectIdSchema,
    videoUrl: z.string().url().optional(),
    imageUrl: z.string().url().optional(),
    status: z.enum(["COMPLETED", "FAILED"]).default("COMPLETED"),
    error: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
});

export type N8nCallbackBody = z.infer<typeof n8nCallbackSchema>["body"];
