import { z } from "zod";

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
export const createProductSchema = z.object({
  body: z.object({
    storeId: z.string().min(1, "Store ID is required"),
    categoryId: z.string().optional(),
    externalId: z.string().min(1, "External ID is required"),
    sku: z.string().optional(),
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    images: z.array(productImageSchema).default([]),
    variants: z.array(productVariantSchema).default([]),
    isActive: z.boolean().default(true),
    inStock: z.boolean().default(true),
  }),
});

// Update product schema
export const updateProductSchema = z.object({
  body: z.object({
    categoryId: z.string().optional(),
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
    storeId: z.string().optional(),
    categoryId: z.string().optional(),
    search: z.string().optional(),
    isActive: z.string().optional(),
    inStock: z.string().optional(),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>["body"];
export type UpdateProductInput = z.infer<typeof updateProductSchema>["body"];

// Bulk delete products schema
export const bulkDeleteProductsSchema = z.object({
  body: z.object({
    ids: z.array(z.string()).min(1, "At least one product ID is required"),
  }),
});

export type BulkDeleteProductsInput = z.infer<
  typeof bulkDeleteProductsSchema
>["body"];

export type GetProductsQuery = z.infer<typeof getProductsSchema>["query"];
