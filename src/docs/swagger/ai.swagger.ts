/**
 * @swagger
 * /ai/test/gemini:
 *   post:
 *     summary: Test Gemini text generation
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *               systemPrompt:
 *                 type: string
 *               maxTokens:
 *                 type: integer
 *               temperature:
 *                 type: number
 *     responses:
 *       200:
 *         description: Success
 */

/**
 * @swagger
 * /ai/test/text:
 *   post:
 *     summary: General text generation test
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *               provider:
 *                 type: string
 *                 description: openai or gemini
 *               systemPrompt:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
