import { z } from "zod";
import { objectIdSchema } from "../../common/validations/common.validation";

// Product image schema
const productImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  position: z.number().int().default(0),
});

// Product variant schema
const productVariantSchema = z.object({
  id: z.string(),
  title: z.string(),
  sku: z.string().optional(),
  inStock: z.boolean().default(true),
  options: z.record(z.string(), z.any()).optional(),
});

// Create product schema
const commonProductFields = {
  categoryIds: z.array(objectIdSchema).default([]),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  images: z.array(productImageSchema).default([]),
  variants: z.array(productVariantSchema).default([]),
  isActive: z.boolean().default(true),
  inStock: z.boolean().default(true),
};

export const createProductSchema = z.object({
  body: z.discriminatedUnion("productSource", [
    z.object({
      productSource: z.literal("STORE"),
      storeId: objectIdSchema,
      externalId: z.string().optional(),
      sku: z.string().optional(),
      ...commonProductFields,
    }),
    z.object({
      productSource: z.literal("UPLOADED"),
      storeId: objectIdSchema.optional(),
      ...commonProductFields,
    }),
  ]),
});

// Update product schema
export const updateProductSchema = z.object({
  body: z.object({
    categoryIds: z.array(objectIdSchema).optional(),
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    images: z.array(productImageSchema).optional(),
    variants: z.array(productVariantSchema).optional(),
    isActive: z.boolean().optional(),
    inStock: z.boolean().optional(),
  }),
});

// Get products query schema
export const getProductsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    storeId: z.preprocess(
      (val) => (val === "" ? undefined : val),
      objectIdSchema.optional(),
    ),
    categoryId: z.preprocess(
      (val) => (val === "" ? undefined : val),
      objectIdSchema.optional(),
    ),
    categoryIds: z.array(objectIdSchema).optional(),
    search: z.string().optional(),
    isActive: z.string().optional(),
    inStock: z.string().optional(),
    folderId: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.string().optional(),
    ),
    sortBy: z.enum(["newest", "oldest"]).optional().default("newest"),
    source: z.enum(["STORE", "UPLOADED", "ALL"]).optional().default("ALL"),
  }),
});

export type CreateProductBody = z.infer<typeof createProductSchema>["body"];
export type UpdateProductBody = z.infer<typeof updateProductSchema>["body"];

// Bulk delete products schema
export const bulkDeleteProductsSchema = z.object({
  body: z.object({
    ids: z.array(objectIdSchema).min(1, "At least one product ID is required"),
  }),
});

export type BulkDeleteProductsBody = z.infer<
  typeof bulkDeleteProductsSchema
>["body"];

export type GetProductsQuery = z.infer<typeof getProductsSchema>["query"];

// --------------------------------------------------------------------------
// Manual Product Schemas
// --------------------------------------------------------------------------

// Create manual product schema
export const createManualProductSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    imageUrl: z.string().url().optional().nullable(),
    images: z.array(productImageSchema).optional(),
    categoryIds: z.array(objectIdSchema).default([]),
    productSource: z.literal("UPLOADED").optional().default("UPLOADED"),
    isActive: z.boolean().default(true),
  }),
});

// Bulk CSV Import schema
export const bulkCsvImportSchema = z.object({
  body: z.object({
    products: z
      .array(
        z.object({
          title: z.string().min(1, "Title is required"),
          description: z.string().optional(),
          imageUrl: z.string().url().optional().nullable(),
          images: z.array(productImageSchema).optional(),
          categoryIds: z.array(objectIdSchema).default([]),
          isActive: z.boolean().default(true),
        }),
      )
      .min(1, "At least one product is required"),
    productSource: z.literal("UPLOADED").optional().default("UPLOADED"),
  }),
});

// Update manual product schema
export const updateManualProductSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
    images: z.array(productImageSchema).optional(),
    categoryIds: z.array(objectIdSchema).optional(),
    productSource: z.literal("UPLOADED").optional().default("UPLOADED"),
    folderId: objectIdSchema.optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

// Folder Schemas
export const createFolderSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Folder name is required"),
    parentId: objectIdSchema.optional(),
  }),
});

export const renameFolderSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Folder name is required"),
  }),
});

export const moveProductsSchema = z.object({
  body: z.object({
    productIds: z
      .array(objectIdSchema)
      .min(1, "At least one product is required"),
    folderId: objectIdSchema.optional().nullable(),
  }),
});

export const moveFolderSchema = z.object({
  body: z.object({
    parentId: objectIdSchema.optional().nullable(),
  }),
});

export const deleteFolderSchema = z.object({
  query: z.object({
    mode: z.enum(["relocate", "recursive"]).default("relocate"),
  }),
});

// Get manual products query schema
export const getManualProductsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.enum(["newest", "oldest"]).optional().default("newest"),
    folderId: z.preprocess(
      (val) => (val === "" ? undefined : val),
      objectIdSchema.optional(),
    ),
    isActive: z.string().optional(),
  }),
});

export type CreateManualProductBody = z.infer<
  typeof createManualProductSchema
>["body"];
export type BulkCsvImportBody = z.infer<typeof bulkCsvImportSchema>["body"];
export type UpdateManualProductBody = z.infer<
  typeof updateManualProductSchema
>["body"];
export type GetManualProductsQuery = z.infer<
  typeof getManualProductsSchema
>["query"];
