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
