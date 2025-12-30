import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { adDraftsController } from "./ad-drafts.controller";
import { upsertAdDraftSchema } from "./ad-drafts.validation";

const router = Router();

// All routes require authentication
router.use(authenticate);

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
router.get("/", adDraftsController.getCurrentDraft.bind(adDraftsController));

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
router.post(
  "/",
  validate(upsertAdDraftSchema),
  adDraftsController.upsertDraft.bind(adDraftsController)
);

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
router.delete("/", adDraftsController.deleteDraft.bind(adDraftsController));

export default router;
