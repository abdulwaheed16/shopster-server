import { Router } from "express";
import { UserRole } from "../../common/constants/roles.constant";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { authorize } from "../../common/middlewares/role.middleware";
import { dashboardController } from "./dashboard.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get user dashboard statistics
 *     description: Returns overview statistics for the authenticated user.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", dashboardController.getUserStats.bind(dashboardController));

/**
 * @swagger
 * /dashboard/admin:
 *   get:
 *     summary: Get admin dashboard statistics (Admin only)
 *     description: Returns platform-wide overview statistics for administrators.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 */
router.get(
  "/admin",
  authorize(UserRole.ADMIN),
  dashboardController.getAdminStats.bind(dashboardController)
);

export default router;
