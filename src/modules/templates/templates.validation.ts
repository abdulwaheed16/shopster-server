import { z } from "zod";

// Create template schema
export const createTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    promptTemplate: z.string().min(1, "Prompt template is required"),
    variableIds: z.array(z.string()).default([]),
    categoryIds: z.array(z.string()).default([]),
    referenceAdImage: z.string().url().optional(),
    productImage: z.string().url().optional(),
  }),
});

// Update template schema
export const updateTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    promptTemplate: z.string().min(1).optional(),
    variableIds: z.array(z.string()).optional(),
    categoryIds: z.array(z.string()).optional(),
    referenceAdImage: z.string().url().optional(),
    productImage: z.string().url().optional(),
    isActive: z.boolean().optional(),
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
  }),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>["body"];
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>["body"];
export type GeneratePreviewInput = z.infer<
  typeof generatePreviewSchema
>["body"];
export type GetTemplatesQuery = z.infer<typeof getTemplatesSchema>["query"];

// Bulk delete templates schema
export const bulkDeleteTemplatesSchema = z.object({
  body: z.object({
    ids: z.array(z.string()).min(1, "At least one template ID is required"),
  }),
});

export type BulkDeleteTemplatesInput = z.infer<
  typeof bulkDeleteTemplatesSchema
>["body"];
