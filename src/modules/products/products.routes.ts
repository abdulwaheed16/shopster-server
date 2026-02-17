import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import * as CommonValidators from "../../common/validations/common.validation";
import { productsController } from "./controllers/products.controller";
import {
  bulkCsvImportSchema,
  bulkDeleteProductsSchema,
  createManualProductSchema,
  createProductSchema,
  getProductsSchema,
  updateManualProductSchema,
  updateProductSchema,
} from "./products.validation";

const router = Router();

// All routes require authentication
router.use(authenticate);

// --------------------------------------------------------------------------
// Unified Product Routes
// --------------------------------------------------------------------------

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products (supports filtering by source)
 *     tags: [Products]
 */
router.get(
  "/",
  validate(getProductsSchema),
  productsController.getProducts.bind(productsController),
);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a product (store or uploaded)
 *     tags: [Products]
 */
router.post(
  "/",
  // Simple check to decide which schema to use, or we could unify the schema too
  (req, res, next) => {
    const schema =
      req.body.productSource === "UPLOADED"
        ? createManualProductSchema
        : createProductSchema;
    return validate(schema)(req, res, next);
  },
  productsController.createProduct.bind(productsController),
);

/**
 * @swagger
 * /products/bulk:
 *   post:
 *     summary: Bulk create products
 *     tags: [Products]
 */
router.post(
  "/bulk",
  (req, res, next) => {
    // Basic dispatcher for bulk import vs sync
    const schema =
      req.body.productSource === "UPLOADED" ? bulkCsvImportSchema : z.any(); // simplified
    return next(); // validate if needed
  },
  productsController.bulkCreateProducts.bind(productsController),
);

/**
 * @swagger
 * /products/bulk-delete:
 *   post:
 *     summary: Bulk delete products
 *     tags: [Products]
 */
router.post(
  "/bulk-delete",
  validate(bulkDeleteProductsSchema),
  productsController.bulkDeleteProducts.bind(productsController),
);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 */
router.get(
  "/:id",
  validate(CommonValidators.idSchema),
  productsController.getProductById.bind(productsController),
);

/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     summary: Update product
 *     tags: [Products]
 */
router.patch(
  "/:id",
  validate(CommonValidators.idSchema),
  (req, res, next) => {
    const isUploaded = req.query.source === "UPLOADED";
    const schema = isUploaded ? updateManualProductSchema : updateProductSchema;
    return validate(schema)(req, res, next);
  },
  productsController.updateProduct.bind(productsController),
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete product
 *     tags: [Products]
 */
router.delete(
  "/:id",
  validate(CommonValidators.idSchema),
  productsController.deleteProduct.bind(productsController),
);

/**
 * @swagger
 * /products/export:
 *   get:
 *     summary: Export products
 *     tags: [Products]
 */
router.get(
  "/export",
  productsController.exportProducts.bind(productsController),
);

// Backward compatibility or categorized routes if you prefer to keep them
router.get(
  "/store",
  validate(getProductsSchema),
  productsController.getProducts.bind(productsController),
);
router.get(
  "/manual",
  validate(getProductsSchema),
  productsController.getProducts.bind(productsController),
);

export default router;
