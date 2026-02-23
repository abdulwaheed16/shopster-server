import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import * as CommonValidators from "../../common/validations/common.validation";
import assetFoldersRoutes from "./asset-folders.routes";
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
// Asset Folder Routes
// --------------------------------------------------------------------------
router.use("/folders", assetFoldersRoutes);

// --------------------------------------------------------------------------
// Unified Product Routes
// --------------------------------------------------------------------------

router.get(
  "/",
  validate(getProductsSchema),
  productsController.getProducts.bind(productsController),
);

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

router.post(
  "/bulk-delete",
  validate(bulkDeleteProductsSchema),
  productsController.bulkDeleteProducts.bind(productsController),
);

router.get(
  "/:id",
  validate(CommonValidators.idSchema),
  productsController.getProductById.bind(productsController),
);

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

router.delete(
  "/:id",
  validate(CommonValidators.idSchema),
  productsController.deleteProduct.bind(productsController),
);

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
