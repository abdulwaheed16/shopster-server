/**
 * @swagger
 * /stores:
 *   get:
 *     summary: Get all stores
 *     description: Returns a paginated list of stores for the authenticated user.
 *     tags: [Stores]
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
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [SHOPIFY]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Stores retrieved successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /stores/{id}:
 *   get:
 *     summary: Get store by ID
 *     description: Returns details of a specific store.
 *     tags: [Stores]
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
 *         description: Store retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Store not found
 */

/**
 * @swagger
 * /stores:
 *   post:
 *     summary: Create a new store
 *     description: Integrates a new store platform with Shopster.
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, platform, storeUrl]
 *             properties:
 *               name:
 *                 type: string
 *               platform:
 *                 type: string
 *                 enum: [SHOPIFY]
 *               storeUrl:
 *                 type: string
 *                 format: uri
 *               shopifyDomain:
 *                 type: string
 *               apiKey:
 *                 type: string
 *               apiSecret:
 *                 type: string
 *               accessToken:
 *                 type: string
 *     responses:
 *       201:
 *         description: Store created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /stores/{id}:
 *   put:
 *     summary: Update store
 *     description: Updates the settings of an existing store.
 *     tags: [Stores]
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
 *               name:
 *                 type: string
 *               storeUrl:
 *                 type: string
 *                 format: uri
 *               apiKey:
 *                 type: string
 *               apiSecret:
 *                 type: string
 *               accessToken:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Store updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Store not found
 */

/**
 * @swagger
 * /stores/{id}:
 *   delete:
 *     summary: Delete store
 *     description: Removes a store integration.
 *     tags: [Stores]
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
 *         description: Store deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Store not found
 */

/**
 * @swagger
 * /stores/{id}/sync:
 *   post:
 *     summary: Sync store products
 *     description: Starts a background job to synchronize products from the store platform.
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       202:
 *         description: Synchronization started
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Store not found
 */

/**
 * @swagger
 * /stores/{id}/categories:
 *   get:
 *     summary: Get unique product types from store products
 *     description: Returns unique product_type strings aggregated from synced store products.
 *     tags: [Stores]
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
 *         description: Store categories (product types) retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Store not found
 */

/**
 * @swagger
 * /stores/{id}/sync-products:
 *   post:
 *     summary: Manually sync products from Shopify
 *     description: Fetches products from Shopify, saves to database, and returns them.
 *     tags: [Stores]
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
 *         description: Products synced successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Store not found
 */
