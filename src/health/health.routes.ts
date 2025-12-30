import { Router } from "express";
import { authenticate } from "../common/middlewares/auth.middleware";
import { sendSuccess } from "../common/utils/response.util";

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 */

router.get("/", (req, res) => {
  sendSuccess(res, "Service is healthy", {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * @swagger
 * /health/protected:
 *   get:
 *     summary: Protected health check (requires authentication)
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service is healthy and user is authenticated
 */
router.get("/protected", authenticate, (req, res) => {
  sendSuccess(res, "Service is healthy and authenticated", {
    status: "ok",
    user: req.user,
    timestamp: new Date().toISOString(),
  });
});

export default router;
