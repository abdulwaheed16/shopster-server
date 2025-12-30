import { z } from "zod";

// Get jobs query schema
export const getJobsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z
      .enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"])
      .optional(),
  }),
});

export type GetJobsQuery = z.infer<typeof getJobsSchema>["query"];
