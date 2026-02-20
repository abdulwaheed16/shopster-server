/**
 * @swagger
 * /ad-drafts:
 *   get:
 *     summary: Get current user ad draft
 *     description: Returns the current ad generation draft for the authenticated user.
 *     tags: [Ad Drafts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current draft retrieved successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /ad-drafts:
 *   post:
 *     summary: Upsert ad draft
 *     description: Creates or updates the ad generation draft for the authenticated user.
 *     tags: [Ad Drafts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentStep:
 *                 type: integer
 *               productId:
 *                 type: string
 *               templateId:
 *                 type: string
 *               variableValues:
 *                 type: object
 *               userPrompt:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Draft updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /ad-drafts:
 *   delete:
 *     summary: Delete ad draft
 *     description: Removes the current ad generation draft.
 *     tags: [Ad Drafts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Draft deleted successfully
 *       401:
 *         description: Unauthorized
 */
