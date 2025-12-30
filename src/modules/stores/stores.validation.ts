import { z } from "zod";

// Store platform enum
export const storePlatformSchema = z.enum(["SHOPIFY"]);

// Create store schema
export const createStoreSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Store name is required"),
    platform: storePlatformSchema,
    storeUrl: z.string().url("Valid store URL is required"),
    shopifyDomain: z.string().optional(),
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    accessToken: z.string().optional(),
  }),
});

// Update store schema
export const updateStoreSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    storeUrl: z.string().url().optional(),
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    accessToken: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

// Get stores query schema
export const getStoresSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    platform: storePlatformSchema.optional(),
    isActive: z.string().optional(),
  }),
});

// Shopify Auth Initiation schema
export const shopifyAuthSchema = z.object({
  query: z.object({
    shop: z.string().min(1, "Shop domain is required"),
  }),
});

// Shopify OAuth Callback schema
export const shopifyCallbackSchema = z.object({
  query: z.object({
    shop: z.string().min(1),
    host: z.string().min(1),
    code: z.string().min(1),
    hmac: z.string().min(1),
    state: z.string().min(1),
    timestamp: z.string().min(1),
  }),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>["body"];
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>["body"];

// Sync products schema
export const syncProductsSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export type SyncProductsParams = z.infer<typeof syncProductsSchema>["params"];
export type GetStoresQuery = z.infer<typeof getStoresSchema>["query"];
export type ShopifyAuthQuery = z.infer<typeof shopifyAuthSchema>["query"];
export type ShopifyCallbackQuery = z.infer<
  typeof shopifyCallbackSchema
>["query"];
