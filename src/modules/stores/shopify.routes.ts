import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { storesController } from "./stores.controller";
import { shopifyAuthSchema, shopifyCallbackSchema } from "./stores.validation";

const router = Router();

/**
 * @swagger
 * /shopify/auth:
 *   get:
 *     summary: Initiate Shopify OAuth
 *     description: Redirects the user to Shopify for authorization.
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: shop
 *         required: true
 *         schema:
 *           type: string
 *         description: The myshopify.com domain of the store.
 *       - in: query
 *         name: token
 *         required: false
 *         schema:
 *           type: string
 *         description: Bearer token for authentication (alternative to header).
 *     responses:
 *       302:
 *         description: Redirect to Shopify OAuth page
 */
router.get(
  "/auth",
  authenticate,
  validate(shopifyAuthSchema),
  storesController.initiateShopifyAuth.bind(storesController)
);

/**
 * @swagger
 * /shopify/callback:
 *   get:
 *     summary: Shopify OAuth Callback
 *     description: Handles the redirect back from Shopify after authorization.
 *     tags: [Stores]
 *     parameters:
 *       - in: query
 *         name: shop
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: hmac
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirect to frontend dashboard with status
 */
router.get(
  "/callback",
  validate(shopifyCallbackSchema),
  storesController.shopifyAuthCallback.bind(storesController)
);

/**
 * @swagger
 * /shopify/webhooks:
 *   post:
 *     summary: Shopify Webhook Handler
 *     description: Receives and processes Shopify webhooks for product updates and deletions.
 *     tags: [Stores]
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post(
  "/webhooks",
  storesController.handleShopifyWebhook.bind(storesController)
);

export default router;
