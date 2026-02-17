import cors from "cors";
import { Router } from "express";
import {
  authenticate,
  authenticateWithQuery,
} from "../../common/middlewares/auth.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import * as CommonValidators from "../../common/validations/common.validation";
import { adsController } from "./ads.controller";
import {
  bulkDeleteAdsSchema,
  generateAdSchema,
  getAdsSchema,
} from "./ads.validation";

const router = Router();

// 1. TEST SSE ROUTE (Completely public)
router.get("/test-sse", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.write('data: { "status": "TEST_CONNECTED" }\n\n');
  const interval = setInterval(() => {
    res.write('data: { "status": "HEARTBEAT" }\n\n');
  }, 2000);
  req.on("close", () => clearInterval(interval));
});

// SSE route must be before global authenticate and should have robust CORS
router.get(
  "/:id/events",
  cors({ origin: true, credentials: false }),
  authenticateWithQuery,
  adsController.streamAdEvents.bind(adsController),
);

// All other routes require authentication via header
router.use(authenticate);

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
router.get(
  "/",
  validate(getAdsSchema),
  adsController.getAds.bind(adsController),
);

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
router.post(
  "/generate",
  validate(generateAdSchema),
  adsController.generateAd.bind(adsController),
);

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
router.get(
  "/:id",
  validate(CommonValidators.idSchema),
  adsController.getAdById.bind(adsController),
);

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
router.post(
  "/:id/cancel",
  validate(CommonValidators.idSchema),
  adsController.cancelAd.bind(adsController),
);

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
router.patch(
  "/:id",
  validate(CommonValidators.idSchema),
  adsController.updateAd.bind(adsController),
);

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
router.delete(
  "/:id",
  validate(CommonValidators.idSchema),
  adsController.deleteAd.bind(adsController),
);

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
router.post(
  "/bulk-delete",
  validate(bulkDeleteAdsSchema),
  adsController.bulkDeleteAds.bind(adsController),
);

export default router;
