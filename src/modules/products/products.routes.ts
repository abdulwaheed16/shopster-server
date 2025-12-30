import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { productsController } from "./products.controller";
import {
  bulkDeleteProductsSchema,
  createProductSchema,
  getProductsSchema,
  updateProductSchema,
} from "./products.validation";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     description: Returns a paginated list of products.
 *     tags: [Products]
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
 *         name: storeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/",
  validate(getProductsSchema),
  productsController.getProducts.bind(productsController)
);

/**
 * @swagger
 * /products/bulk:
 *   post:
 *     summary: Bulk create products
 *     description: Creates multiple products at once (used for Shopify sync).
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       201:
 *         description: Products created successfully
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/bulk",
  productsController.bulkCreateProducts.bind(productsController)
);

/**
 * @swagger
 * /products/bulk-delete:
 *   post:
 *     summary: Bulk delete products
 *     description: Deletes multiple products at once.
 *     tags: [Products]
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
 *         description: Products deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/bulk-delete",
  validate(bulkDeleteProductsSchema),
  productsController.bulkDeleteProducts.bind(productsController)
);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     description: Returns details of a specific product.
 *     tags: [Products]
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
 *         description: Product retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */
router.get("/:id", productsController.getProductById.bind(productsController));

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a product
 *     description: Manually creates a new product.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  validate(createProductSchema),
  productsController.createProduct.bind(productsController)
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update product
 *     description: Updates the information profile of a specific product.
 *     tags: [Products]
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
 *             $ref: '#/components/schemas/ProductUpdateInput'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */
router.put(
  "/:id",
  validate(updateProductSchema),
  productsController.updateProduct.bind(productsController)
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete product
 *     description: Deletes a specific product.
 *     tags: [Products]
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
 *         description: Product deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */
router.delete(
  "/:id",
  productsController.deleteProduct.bind(productsController)
);

export default router;
