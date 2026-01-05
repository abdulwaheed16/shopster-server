import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import * as CommonValidators from "../../common/validations/common.validation";
import { adsController } from "./ads.controller";
import {
  bulkDeleteAdsSchema,
  generateAdSchema,
  getAdsSchema,
} from "./ads.validation";

const router = Router();

// All routes require authentication
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
  adsController.getAds.bind(adsController)
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
 *                 enum: ["1:1", "16:9", "9:16", "4:5"]
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
  adsController.generateAd.bind(adsController)
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
  adsController.getAdById.bind(adsController)
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
  adsController.deleteAd.bind(adsController)
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
  adsController.bulkDeleteAds.bind(adsController)
);

export default router;
