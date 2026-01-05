import { z } from "zod";
import { objectIdSchema } from "../../common/validations/common.validation";

// Analytics query schema
export const analyticsQuerySchema = z.object({
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    storeId: objectIdSchema.optional(),
  }),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>["query"];
