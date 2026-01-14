import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { aiController } from "./ai.controller";

const router = Router();

// Require authentication for all AI testing routes
router.use(authenticate);

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
router.post("/test/gemini", aiController.testGeminiText.bind(aiController));

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
router.post("/test/text", aiController.testTextGeneration.bind(aiController));

export default router;
