import { Router } from "express";
import { UserRole } from "../../common/constants/roles.constant";
import { auditLogger } from "../../common/middlewares/audit-logger.middleware";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { authorize } from "../../common/middlewares/role.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { usersController } from "./users.controller";
import {
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
  authorize(UserRole.ADMIN),
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
  authorize(UserRole.ADMIN),
  validate(updateUserSchema),
  auditLogger("UPDATE_USER", "User"),
  usersController.updateUser.bind(usersController),
);

// Delete user (Admin only)
router.delete(
  "/:id",
  authorize(UserRole.ADMIN),
  validate(deleteUserSchema),
  auditLogger("DELETE_USER", "User"),
  usersController.deleteUser.bind(usersController),
);

// Update user role (Admin only)
router.put(
  "/:id/role",
  authorize(UserRole.ADMIN),
  validate(updateUserRoleSchema),
  auditLogger("UPDATE_USER_ROLE", "User"),
  usersController.updateUserRole.bind(usersController),
);

export default router;
