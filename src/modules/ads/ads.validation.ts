import { z } from "zod";
import { objectIdSchema } from "../../common/validations/common.validation";
import { ASPECT_RATIOS } from "../ai/ai.constants";

// Generate ad schema
export const generateAdSchema = z.object({
  body: z
    .object({
      productId: objectIdSchema.optional(),
      uploadedProductId: objectIdSchema.optional(),
      templateId: objectIdSchema.optional(),
      productImageUrls: z
        .array(z.string().url())
        .min(1, "Minimum 1 product image is required")
        .max(3, "Maximum 3 product images are allowed")
        .optional(),
      templateImageUrl: z
        .string()
        .optional()
        .transform((val) => (val === "" ? undefined : val))
        .pipe(z.string().url().optional()),
      modelImageUrl: z
        .string()
        .optional()
        .transform((val) => (val === "" ? undefined : val))
        .pipe(z.string().url().optional()),
      productTitle: z.string().optional(),
      title: z.string().optional(),
      variableValues: z.record(z.string(), z.any()).optional(), // JSON object
      aspectRatio: z
        .enum(Object.values(ASPECT_RATIOS) as [string, ...string[]])
        .optional(),
      variantsCount: z.number().int().min(1).max(4).optional(),
      style: z.string().optional(),
      color: z.string().optional(),
      scenes: z.array(z.string()).optional(),
      duration: z.number().int().min(5).max(15).optional(),
      videoScript: z
        .object({
          type: z.enum(["TEXT", "VOICE"]),
          content: z.string().min(1, "Script content is required"),
        })
        .optional(),
      mediaType: z.enum(["IMAGE", "VIDEO"]).optional(),
      prompt: z.string().optional(),
    })
    .refine(
      (data) => {
        // Must have either productId, uploadedProductId, or productImageUrls
        if (
          !data.productId &&
          !data.uploadedProductId &&
          !data.productImageUrls
        ) {
          return false;
        }
        return true;
      },
      {
        message:
          "Product is required (from store, uploaded, or direct image URL)",
        path: ["productId"],
      },
    )
    .refine(
      (data) => {
        // Image ads REQUIRE a templateId OR a templateImageUrl.
        if (
          data.mediaType === "IMAGE" &&
          !data.templateId &&
          !data.templateImageUrl
        ) {
          return false;
        }
        return true;
      },
      {
        message: "Template is required for Image Ads",
        path: ["templateId"],
      },
    ),
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

// n8n Callback schema ---- mock
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
