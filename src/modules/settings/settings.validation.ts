import { z } from "zod";
import {
  emailSchema,
  nameSchema,
  optionalPasswordSchema,
} from "../../common/validations/common.validation";

// Update profile schema
export const updateProfileSchema = z.object({
  body: z
    .object({
      name: nameSchema.optional(),
      email: emailSchema.optional(),
      image: z.string().url().optional(),
      avatar: z.string().url().optional(),
      password: optionalPasswordSchema,
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update",
    }),
});

// Update security schema
export const updateSecuritySchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>["body"];
export type UpdateSecurityInput = z.infer<typeof updateSecuritySchema>["body"];
