import { z } from "zod";

// Delete image schema
export const deleteImageSchema = z.object({
  params: z.object({
    publicId: z.string().min(1),
  }),
});

export type DeleteImageParams = z.infer<typeof deleteImageSchema>["params"];
