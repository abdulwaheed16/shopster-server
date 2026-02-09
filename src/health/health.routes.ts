import { Router } from "express";
import {
  healthCheck,
  livenessCheck,
  readinessCheck,
  startupCheck,
} from "./health.controller";

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: General health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *       503:
 *         description: Service is unhealthy
 */
router.get("/", healthCheck);

/**
 * @swagger
 * /health/liveness:
 *   get:
 *     summary: Liveness probe
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 */
router.get("/liveness", livenessCheck);

/**
 * @swagger
 * /health/readiness:
 *   get:
 *     summary: Readiness probe
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready to handle traffic
 *       503:
 *         description: Service is not ready
 */
router.get("/readiness", readinessCheck);

/**
 * @swagger
 * /health/startup:
 *   get:
 *     summary: Startup probe
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service has finished starting
 *       503:
 *         description: Service is still starting
 */
router.get("/startup", startupCheck);

export default router;
