import { Router } from "express";
import { Permission } from "../../common/constants/permissions.constant";
import { auditLogger } from "../../common/middlewares/audit-logger.middleware";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { hasPermissions } from "../../common/middlewares/permission.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { usersController } from "./users.controller";
import {
  adminChangePasswordSchema,
  createUserSchema,
  deleteUserSchema,
  getUserByIdSchema,
  getUsersSchema,
  updateUserRoleSchema,
  updateUserSchema,
} from "./users.validation";

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get("/profile", usersController.getProfile.bind(usersController));

router.put("/profile", usersController.updateProfile.bind(usersController));

router.get(
  "/",
  hasPermissions(Permission.VIEW_USERS),
  validate(getUsersSchema),
  usersController.getUsers.bind(usersController),
);

router.get(
  "/:id",
  validate(getUserByIdSchema),
  usersController.getUserById.bind(usersController),
);

// Update user (Admin only)
router.put(
  "/:id",
  hasPermissions(Permission.EDIT_USER),
  validate(updateUserSchema),
  auditLogger("UPDATE_USER", "User"),
  usersController.updateUser.bind(usersController),
);

// Delete user (Admin only)
router.delete(
  "/:id",
  hasPermissions(Permission.DELETE_USER),
  validate(deleteUserSchema),
  auditLogger("DELETE_USER", "User"),
  usersController.deleteUser.bind(usersController),
);

// Update user role (Admin only)
router.put(
  "/:id/role",
  hasPermissions(Permission.CHANGE_USER_ROLE),
  validate(updateUserRoleSchema),
  auditLogger("UPDATE_USER_ROLE", "User"),
  usersController.updateUserRole.bind(usersController),
);

// Create user (Admin only)
router.post(
  "/",
  hasPermissions(Permission.CREATE_USER),
  validate(createUserSchema),
  auditLogger("CREATE_USER", "User"),
  usersController.createUser.bind(usersController),
);

// Change user password (Admin only)
router.put(
  "/:id/password",
  hasPermissions(Permission.CHANGE_USER_PASSWORD),
  validate(adminChangePasswordSchema),
  auditLogger("CHANGE_USER_PASSWORD", "User"),
  usersController.adminChangePassword.bind(usersController),
);

export default router;
