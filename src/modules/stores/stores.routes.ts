import { Router } from "express";
import { Permission } from "../../common/constants/permissions.constant";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { hasPermissions } from "../../common/middlewares/permission.middleware";
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

router.use(authenticate);

router.get(
  "/",
  hasPermissions(Permission.VIEW_STORES),
  validate(getStoresSchema),
  storesController.getStores.bind(storesController),
);

router.get(
  "/:id",
  hasPermissions(Permission.VIEW_STORES),
  validate(CommonValidators.idSchema),
  storesController.getStoreById.bind(storesController),
);

router.post(
  "/",
  hasPermissions(Permission.CREATE_STORE),
  validate(createStoreSchema),
  storesController.createStore.bind(storesController),
);

router.put(
  "/:id",
  hasPermissions(Permission.EDIT_STORE),
  validate(CommonValidators.idSchema),
  validate(updateStoreSchema),
  storesController.updateStore.bind(storesController),
);

router.delete(
  "/:id",
  hasPermissions(Permission.DELETE_STORE),
  validate(CommonValidators.idSchema),
  storesController.deleteStore.bind(storesController),
);

router.post(
  "/:id/sync",
  hasPermissions(Permission.SYNC_STORE),
  validate(CommonValidators.idSchema),
  storesController.syncStore.bind(storesController),
);

router.get(
  "/:id/categories",
  hasPermissions(Permission.VIEW_STORES),
  validate(CommonValidators.idSchema),
  storesController.getStoreCategories.bind(storesController),
);

router.post(
  "/:id/sync-products",
  hasPermissions(Permission.SYNC_STORE),
  validate(syncProductsSchema),
  storesController.syncProductsManually.bind(storesController),
);

export default router;
