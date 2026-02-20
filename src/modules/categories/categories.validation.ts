import { z } from "zod";
import { objectIdSchema } from "../../common/validations/common.validation";

// Create category schema
export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    slug: z
      .string()
      .min(1, "Slug is required")
      .regex(
        /^[a-z0-9-]+$/,
        "Slug must be lowercase alphanumeric with hyphens",
      ),
    description: z.string().optional(),
    parentId: objectIdSchema.optional(),
    icon: z.string().url().optional(),
  }),
});

// Update category schema
export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    slug: z
      .string()
      .min(1)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    description: z.string().optional(),
    parentId: objectIdSchema.optional(),
    icon: z.string().url().optional(),
  }),
});

export const getCategoriesSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    parentId: objectIdSchema.optional(),
    mediaType: z.enum(["IMAGE", "VIDEO"]).optional(),
    withTemplatesOnly: z
      .string()
      .optional()
      .transform((val) => val === "true"),
    productSource: z.enum(["STORE", "UPLOADED"]).optional(),
  }),
});

export type CreateCategoryBody = z.infer<typeof createCategorySchema>["body"];
export type UpdateCategoryBody = z.infer<typeof updateCategorySchema>["body"];
export type GetCategoriesQuery = z.infer<typeof getCategoriesSchema>["query"];
