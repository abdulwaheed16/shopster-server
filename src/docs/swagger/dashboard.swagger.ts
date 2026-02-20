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
