import { z } from "zod";

// Create template schema
export const createTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    promptTemplate: z.string(),
    variableIds: z.array(z.string()).default([]),
    category: z.string().optional(),
    categoryIds: z.array(z.string()).default([]),
    referenceAdImage: z.string().optional(),
    productImage: z.string().optional(),
    isPublic: z.boolean().default(true),
    assignedUserId: z.string().optional(), // Optional assignment to a user
  }),
});

// Update template schema
export const updateTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    promptTemplate: z.string().optional(),
    variableIds: z.array(z.string()).optional(),
    category: z.string().optional(),
    categoryIds: z.array(z.string()).optional(),
    referenceAdImage: z.string().optional(),
    productImage: z.string().optional(),
    isActive: z.boolean().optional(),
    isPublic: z.boolean().optional(),
    assignedUserId: z.string().optional(),
  }),
});

// Generate preview schema
export const generatePreviewSchema = z.object({
  body: z.object({
    templateId: z.string().min(1, "Template ID is required"),
  }),
});

// Get templates query schema
export const getTemplatesSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    categoryId: z.string().optional(),
    isActive: z.string().optional(),
    filterType: z.enum(["mine", "others", "all"]).default("all"),
  }),
});

export type CreateTemplateBody = z.infer<typeof createTemplateSchema>["body"];
export type UpdateTemplateBody = z.infer<typeof updateTemplateSchema>["body"];
export type GeneratePreviewBody = z.infer<typeof generatePreviewSchema>["body"];
export type GetTemplatesQuery = z.infer<typeof getTemplatesSchema>["query"];

// Bulk delete templates schema
export const bulkDeleteTemplatesSchema = z.object({
  body: z.object({
    ids: z.array(z.string()).min(1, "At least one template ID is required"),
  }),
});

export type BulkDeleteTemplatesBody = z.infer<
  typeof bulkDeleteTemplatesSchema
>["body"];
