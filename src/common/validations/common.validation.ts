import { z } from "zod";

// MongoDB ObjectId validation
export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

// Common validation schemas
export const idSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const emailSchema = z.string().email("Invalid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const optionalPasswordSchema = passwordSchema.optional();

export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(100, "Name must not exceed 100 characters")
  .optional();

export const urlSchema = z.string().url("Invalid URL format");

export const optionalUrlSchema = urlSchema.optional();

// Date validation
export const dateSchema = z.coerce.date();

export const optionalDateSchema = dateSchema.optional();

// Enum validation helper
export const createEnumSchema = <T extends string>(enumValues: T[]) => {
  return z.enum(enumValues as [T, ...T[]]);
};
