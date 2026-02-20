/**
 * @swagger
 * /analytics/ads:
 *   get:
 *     summary: Get ad analytics
 *     description: Returns analytics and metrics for user's ads.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Ad analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /analytics/stores:
 *   get:
 *     summary: Get store analytics
 *     description: Returns analytics and metrics for user's stores.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Store analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /analytics/products:
 *   get:
 *     summary: Get product analytics
 *     description: Returns analytics and metrics for user's products.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
