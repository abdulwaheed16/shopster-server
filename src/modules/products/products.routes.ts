import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import * as CommonValidators from "../../common/validations/common.validation";
import assetFoldersRoutes from "./asset-folders.routes";
import { productsController } from "./controllers/products.controller";
import {
  bulkCsvImportSchema,
  bulkDeleteProductsSchema,
  createProductSchema,
  getProductsSchema,
  updateProductSchema,
} from "./products.validation";

const router = Router();

router.use(authenticate);

// Asset Folder Routes
router.use("/folders", assetFoldersRoutes);

// Unified Product Routes

router.get(
  "/",
  validate(getProductsSchema),
  productsController.getProducts.bind(productsController),
);

router.post(
  "/",
  validate(createProductSchema),
  productsController.createProduct.bind(productsController),
);

router.post(
  "/bulk",
  validate(bulkCsvImportSchema),
  productsController.bulkCreateProducts.bind(productsController),
);

router.post(
  "/bulk-delete",
  validate(bulkDeleteProductsSchema),
  productsController.bulkDeleteProducts.bind(productsController),
);

router.get(
  "/export",
  productsController.exportProducts.bind(productsController),
);

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

router.get(
  "/:id",
  validate(CommonValidators.idSchema),
  productsController.getProductById.bind(productsController),
);

router.patch(
  "/:id",
  validate(CommonValidators.idSchema),
  validate(updateProductSchema),
  productsController.updateProduct.bind(productsController),
);

router.delete(
  "/:id",
  validate(CommonValidators.idSchema),
  productsController.deleteProduct.bind(productsController),
);

export default router;
