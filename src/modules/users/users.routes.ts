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

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get current user profile
 *     description: Returns the profile information of the authenticated user.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/profile", usersController.getProfile.bind(usersController));

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update current user profile
 *     description: Updates the profile information of the authenticated user.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input or email already in use
 *       401:
 *         description: Unauthorized
 */
router.put("/profile", usersController.updateProfile.bind(usersController));

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (Admin only)
 *     description: Returns a paginated list of all users.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 */
router.get(
  "/",
  authorize(UserRole.ADMIN),
  validate(getUsersSchema),
  usersController.getUsers.bind(usersController),
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Returns the profile information of a specific user.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get(
  "/:id",
  validate(getUserByIdSchema),
  usersController.getUserById.bind(usersController),
);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user (Admin only)
 *     description: Updates the information profile of a specific user.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input or email already in use
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: User not found
 */

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
