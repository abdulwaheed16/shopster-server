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
