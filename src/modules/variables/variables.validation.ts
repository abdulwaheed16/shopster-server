import { z } from "zod";

// Variable type enum
export const variableTypeSchema = z.enum([
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "SELECT",
  "COLOR",
  "IMAGE_URL",
]);

// Create variable schema
export const createVariableSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "Name is required")
      .regex(/^[a-zA-Z0-9_]+$/, "Name must be alphanumeric with underscores"),
    label: z.string().min(1, "Label is required"),
    type: variableTypeSchema,
    placeholder: z.string().optional(),
    defaultValue: z.string().optional(),
    required: z.boolean().default(false),
    validation: z.record(z.string(), z.any()).optional(), // JSON validation rules
  }),
});

// Update variable schema
export const updateVariableSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1)
      .regex(/^[a-zA-Z0-9_]+$/)
      .optional(),
    label: z.string().min(1).optional(),
    type: variableTypeSchema.optional(),
    placeholder: z.string().optional(),
    defaultValue: z.string().optional(),
    required: z.boolean().optional(),
    validation: z.record(z.string(), z.any()).optional(),
  }),
});

// Get variables query schema
export const getVariablesSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    type: variableTypeSchema.optional(),
    search: z.string().optional(),
  }),
});

// Export types
export type CreateVariableInput = z.infer<typeof createVariableSchema>["body"];
export type UpdateVariableInput = z.infer<typeof updateVariableSchema>["body"];
export type GetVariablesQuery = z.infer<typeof getVariablesSchema>["query"];
