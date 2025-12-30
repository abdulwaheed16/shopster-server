import { z } from "zod";
import { UserRole } from "../../common/constants/roles.constant";
import {
  emailSchema,
  nameSchema,
  optionalPasswordSchema,
} from "../../common/validations/common.validation";
import { paginationSchema } from "../../common/validations/pagination.validation";

// Get users validation (with pagination)
export const getUsersSchema = paginationSchema;

// Get user by ID validation
export const getUserByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
});

// Update user validation
export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
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
    id: z.string().min(1, "User ID is required"),
  }),
});

export type GetUsersInput = z.infer<typeof getUsersSchema>["query"];
export type GetUserByIdInput = z.infer<typeof getUserByIdSchema>["params"];
export type UpdateUserInput = {
  params: z.infer<typeof updateUserSchema>["params"];
  body: z.infer<typeof updateUserSchema>["body"];
};
export type DeleteUserInput = z.infer<typeof deleteUserSchema>["params"];

// Update user role validation
export const updateUserRoleSchema = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
  body: z.object({
    role: z.nativeEnum(UserRole),
  }),
});

export type UpdateUserRoleInput = {
  params: z.infer<typeof updateUserRoleSchema>["params"];
  body: z.infer<typeof updateUserRoleSchema>["body"];
};

