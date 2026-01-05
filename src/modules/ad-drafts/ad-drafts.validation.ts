import { z } from "zod";
import { objectIdSchema } from "../../common/validations/common.validation";

// Create/update ad draft schema
export const upsertAdDraftSchema = z.object({
  body: z.object({
    currentStep: z.number().int().min(1).max(3).optional(),
    productId: objectIdSchema.optional(),
    templateId: objectIdSchema.optional(),
    variableValues: z.record(z.string(), z.any()).optional(),
    userPrompt: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
});

export type UpsertAdDraftInput = z.infer<typeof upsertAdDraftSchema>["body"];
