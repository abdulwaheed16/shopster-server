import { z } from "zod";
import { UserRole } from "../../common/constants/roles.constant";
import {
  emailSchema,
  nameSchema,
  objectIdSchema,
  optionalPasswordSchema,
} from "../../common/validations/common.validation";
import { paginationSchema } from "../../common/validations/pagination.validation";

// Get users validation (with pagination)
export const getUsersSchema = paginationSchema;

// Get user by ID validation
export const getUserByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// Update user validation
export const updateUserSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z
    .object({
      name: nameSchema,
      email: emailSchema.optional(),
      password: optionalPasswordSchema,
      role: z.nativeEnum(UserRole).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update",
    }),
});

// Delete user validation
export const deleteUserSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export type GetUsersQuery = z.infer<typeof getUsersSchema>["query"];
export type GetUserByIdParams = z.infer<typeof getUserByIdSchema>["params"];
export type UpdateUserParams = z.infer<typeof updateUserSchema>["params"];
export type UpdateUserBody = z.infer<typeof updateUserSchema>["body"];
export type DeleteUserParams = z.infer<typeof deleteUserSchema>["params"];

// Update user role validation
export const updateUserRoleSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    role: z.nativeEnum(UserRole),
  }),
});

export type UpdateUserRoleParams = z.infer<
  typeof updateUserRoleSchema
>["params"];
export type UpdateUserRoleBody = z.infer<typeof updateUserRoleSchema>["body"];
