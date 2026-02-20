/**
 * @swagger
 * /ads/generate:
 *   post:
 *     summary: Generate a new ad
 *     description: Starts an AI-powered ad generation process.
 *     tags: [Ads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, templateId, variableValues]
 *             properties:
 *               productId:
 *                 type: string
 *               templateId:
 *                 type: string
 *               title:
 *                 type: string
 *               variableValues:
 *                 type: object
 *               aspectRatio:
 *                 type: string
 *                 enum: ["1:1", "4:5", "9:16", "16:9"]
 *               variantsCount:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 4
 *     responses:
 *       202:
 *         description: Ad generation started
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /ads:
 *   get:
 *     summary: Get all ads
 *     description: Returns a paginated list of ads for the authenticated user.
 *     tags: [Ads]
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, COMPLETED, FAILED]
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *       - in: query
 *         name: templateId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ads retrieved successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /ads/{id}:
 *   get:
 *     summary: Get ad by ID
 *     description: Returns details of a specific ad.
 *     tags: [Ads]
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
 *         description: Ad retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Ad not found
 */

/**
 * @swagger
 * /ads/{id}/cancel:
 *   post:
 *     summary: Cancel ad generation
 *     description: Cancels a pending or processing ad generation.
 *     tags: [Ads]
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
 *         description: Ad generation cancelled
 *       404:
 *         description: Ad not found
 */

/**
 * @swagger
 * /ads/{id}:
 *   patch:
 *     summary: Update ad
 *     description: Updates a specific ad (title, status, etc.).
 *     tags: [Ads]
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
 *               title:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [PENDING, PROCESSING, COMPLETED, FAILED]
 *     responses:
 *       200:
 *         description: Ad updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Ad not found
 */

/**
 * @swagger
 * /ads/{id}:
 *   delete:
 *     summary: Delete ad
 *     description: Deletes a specific ad.
 *     tags: [Ads]
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
 *         description: Ad deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Ad not found
 */

/**
 * @swagger
 * /ads/bulk-delete:
 *   post:
 *     summary: Bulk delete ads
 *     description: Deletes multiple ads at once.
 *     tags: [Ads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Ads deleted successfully
 *       401:
 *         description: Unauthorized
 */
