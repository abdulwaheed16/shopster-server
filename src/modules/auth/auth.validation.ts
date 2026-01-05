import { z } from "zod";
import {
  emailSchema,
  nameSchema,
  passwordSchema,
} from "../../common/validations/common.validation";

// Register validation
export const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    name: nameSchema,
  }),
});

// Login validation
export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
  }),
});

// Refresh token validation
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

// Verify email validation
export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Verification token is required"),
  }),
});

// Request password reset validation
export const requestPasswordResetSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

// Reset password validation
export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Reset token is required"),
    password: passwordSchema,
  }),
});

// Change password validation
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
  }),
});

export type RegisterBody = z.infer<typeof registerSchema>["body"];
export type LoginBody = z.infer<typeof loginSchema>["body"];
export type RefreshTokenBody = z.infer<typeof refreshTokenSchema>["body"];
export type VerifyEmailBody = z.infer<typeof verifyEmailSchema>["body"];
export type RequestPasswordResetBody = z.infer<
  typeof requestPasswordResetSchema
>["body"];
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>["body"];
export type ChangePasswordBody = z.infer<typeof changePasswordSchema>["body"];

