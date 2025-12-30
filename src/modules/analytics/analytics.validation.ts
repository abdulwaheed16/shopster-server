import { z } from "zod";

// Analytics query schema
export const analyticsQuerySchema = z.object({
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    storeId: z.string().optional(),
  }),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>["query"];
