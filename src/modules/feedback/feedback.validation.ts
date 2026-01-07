import { z } from "zod";

export const createFeedbackSchema = z.object({
  body: z.object({
    type: z
      .enum(["GENERAL", "BUG", "FEATURE_REQUEST", "IMPROVEMENT"])
      .default("GENERAL"),
    subject: z.string().min(1, "Subject is required"),
    content: z.string().min(1, "Content is required"),
  }),
});

export const updateFeedbackStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Feedback ID is required"),
  }),
  body: z.object({
    status: z.enum(["PENDING", "REVIEWED", "RESOLVED", "REJECTED"]),
    adminNotes: z.string().optional(),
  }),
});

export type CreateFeedbackBody = z.infer<typeof createFeedbackSchema>["body"];
export type UpdateFeedbackStatusBody = z.infer<
  typeof updateFeedbackStatusSchema
>["body"];
