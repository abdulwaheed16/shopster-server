import { Router } from "express";
import { z } from "zod";
import { Permission } from "../../common/constants/permissions.constant";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { hasPermissions } from "../../common/middlewares/permission.middleware";
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

router.use(authenticate);

// Asset Folder Routes
router.use("/folders", assetFoldersRoutes);

// Unified Product Routes

router.get(
  "/",
  hasPermissions(Permission.VIEW_PRODUCTS),
  validate(getProductsSchema),
  productsController.getProducts.bind(productsController),
);

router.post(
  "/",
  hasPermissions(Permission.CREATE_PRODUCT),
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
  hasPermissions(Permission.IMPORT_PRODUCTS_CSV),
  (req, res, next) => {
    const schema =
      req.body.productSource === "UPLOADED" ? bulkCsvImportSchema : z.any();
    return next();
  },
  productsController.bulkCreateProducts.bind(productsController),
);

router.post(
  "/bulk-delete",
  hasPermissions(Permission.BULK_DELETE_PRODUCTS),
  validate(bulkDeleteProductsSchema),
  productsController.bulkDeleteProducts.bind(productsController),
);

router.get(
  "/export",
  hasPermissions(Permission.EXPORT_PRODUCTS),
  productsController.exportProducts.bind(productsController),
);

router.get(
  "/store",
  hasPermissions(Permission.VIEW_PRODUCTS),
  validate(getProductsSchema),
  productsController.getProducts.bind(productsController),
);

router.get(
  "/manual",
  hasPermissions(Permission.VIEW_PRODUCTS),
  validate(getProductsSchema),
  productsController.getProducts.bind(productsController),
);

router.get(
  "/:id",
  hasPermissions(Permission.VIEW_PRODUCTS),
  validate(CommonValidators.idSchema),
  productsController.getProductById.bind(productsController),
);

router.patch(
  "/:id",
  hasPermissions(Permission.EDIT_PRODUCT),
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
  hasPermissions(Permission.DELETE_PRODUCT),
  validate(CommonValidators.idSchema),
  productsController.deleteProduct.bind(productsController),
);

export default router;
