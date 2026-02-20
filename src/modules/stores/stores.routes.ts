import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import * as CommonValidators from "../../common/validations/common.validation";
import { storesController } from "./stores.controller";
import {
  createStoreSchema,
  getStoresSchema,
  syncProductsSchema,
  updateStoreSchema,
} from "./stores.validation";

const router = Router();

// All other routes require authentication via header
router.use(authenticate);

router.get(
  "/",
  validate(getStoresSchema),
  storesController.getStores.bind(storesController),
);

router.get(
  "/:id",
  validate(CommonValidators.idSchema),
  storesController.getStoreById.bind(storesController),
);

router.post(
  "/",
  validate(createStoreSchema),
  storesController.createStore.bind(storesController),
);

router.put(
  "/:id",
  validate(CommonValidators.idSchema),
  validate(updateStoreSchema),
  storesController.updateStore.bind(storesController),
);

router.delete(
  "/:id",
  validate(CommonValidators.idSchema),
  storesController.deleteStore.bind(storesController),
);

router.post(
  "/:id/sync",
  validate(CommonValidators.idSchema),
  storesController.syncStore.bind(storesController),
);

router.get(
  "/:id/categories",
  validate(CommonValidators.idSchema),
  storesController.getStoreCategories.bind(storesController),
);

router.post(
  "/:id/sync-products",
  validate(syncProductsSchema),
  storesController.syncProductsManually.bind(storesController),
);

export default router;
