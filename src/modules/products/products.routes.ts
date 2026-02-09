import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import * as CommonValidators from "../../common/validations/common.validation";
import { manualProductsController } from "./controllers/manual-products.controller";
import { storeProductsController } from "./controllers/store-products.controller";
import {
  bulkCsvImportSchema,
  bulkDeleteProductsSchema,
  createManualProductSchema,
  createProductSchema,
  getManualProductsSchema,
  getProductsSchema,
  updateManualProductSchema,
  updateProductSchema,
} from "./products.validation";

const router = Router();

// All routes require authentication
router.use(authenticate);

// --------------------------------------------------------------------------
// Store-Synced Products Routes
// --------------------------------------------------------------------------

/**
 * @swagger
 * /products/store:
 *   get:
 *     summary: Get all store products
 *     tags: [Store Products]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/store",
  validate(getProductsSchema),
  storeProductsController.getProducts.bind(storeProductsController),
);

/**
 * @swagger
 * /products/store/bulk:
 *   post:
 *     summary: Bulk create store products
 *     tags: [Store Products]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/store/bulk",
  storeProductsController.bulkCreateProducts.bind(storeProductsController),
);

/**
 * @swagger
 * /products/store/bulk-delete:
 *   post:
 *     summary: Bulk delete store products
 *     tags: [Store Products]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/store/bulk-delete",
  validate(bulkDeleteProductsSchema),
  storeProductsController.bulkDeleteProducts.bind(storeProductsController),
);

/**
 * @swagger
 * /products/store/{id}:
 *   get:
 *     summary: Get store product by ID
 *     tags: [Store Products]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/store/:id",
  validate(CommonValidators.idSchema),
  storeProductsController.getProductById.bind(storeProductsController),
);

/**
 * @swagger
 * /products/store:
 *   post:
 *     summary: Create a store product
 *     tags: [Store Products]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/store",
  validate(createProductSchema),
  storeProductsController.createProduct.bind(storeProductsController),
);

/**
 * @swagger
 * /products/store/{id}:
 *   put:
 *     summary: Update store product
 *     tags: [Store Products]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  "/store/:id",
  validate(CommonValidators.idSchema),
  validate(updateProductSchema),
  storeProductsController.updateProduct.bind(storeProductsController),
);

/**
 * @swagger
 * /products/store/{id}:
 *   delete:
 *     summary: Delete store product
 *     tags: [Store Products]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/store/:id",
  validate(CommonValidators.idSchema),
  storeProductsController.deleteProduct.bind(storeProductsController),
);

// --------------------------------------------------------------------------
// Manual/Uploaded Products Routes
// --------------------------------------------------------------------------

/**
 * @swagger
 * /products/manual:
 *   get:
 *     summary: Get all manual products
 *     tags: [Manual Products]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/manual",
  validate(getManualProductsSchema),
  manualProductsController.getManualProducts.bind(manualProductsController),
);

/**
 * @swagger
 * /products/manual:
 *   post:
 *     summary: Create a manual product
 *     tags: [Manual Products]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/manual",
  validate(createManualProductSchema),
  manualProductsController.createManualProduct.bind(manualProductsController),
);

/**
 * @swagger
 * /products/manual/bulk:
 *   post:
 *     summary: Create multiple manual products
 *     tags: [Manual Products]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/manual/bulk",
  validate(bulkCsvImportSchema),
  manualProductsController.bulkCreateManualProducts.bind(
    manualProductsController,
  ),
);

/**
 * @swagger
 * /products/manual/export:
 *   get:
 *     summary: Export manual products as JSON/CSV data
 *     tags: [Manual Products]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/manual/export",
  manualProductsController.exportManualProducts.bind(manualProductsController),
);

/**
 * @swagger
 * /products/manual/{id}:
 *   get:
 *     summary: Get manual product by ID
 *     tags: [Manual Products]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/manual/:id",
  validate(CommonValidators.idSchema),
  manualProductsController.getManualProductById.bind(manualProductsController),
);

/**
 * @swagger
 * /products/manual/{id}:
 *   patch:
 *     summary: Update manual product
 *     tags: [Manual Products]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  "/manual/:id",
  validate(CommonValidators.idSchema),
  validate(updateManualProductSchema),
  manualProductsController.updateManualProduct.bind(manualProductsController),
);

/**
 * @swagger
 * /products/manual/{id}:
 *   delete:
 *     summary: Delete manual product
 *     tags: [Manual Products]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/manual/:id",
  validate(CommonValidators.idSchema),
  manualProductsController.deleteManualProduct.bind(manualProductsController),
);

export default router;
