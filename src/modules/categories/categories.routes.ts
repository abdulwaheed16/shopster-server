import { Router } from "express";
import { Permission } from "../../common/constants/permissions.constant";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { hasPermissions } from "../../common/middlewares/permission.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import * as CommonValidators from "../../common/validations/common.validation";
import { categoriesController } from "./categories.controller";
import {
  createCategorySchema,
  getCategoriesSchema,
  updateCategorySchema,
} from "./categories.validation";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  // hasPermissions(Permission.VIEW_CATEGORIES),
  validate(getCategoriesSchema),
  categoriesController.getCategories.bind(categoriesController),
);

router.get(
  "/:id",
  hasPermissions(Permission.VIEW_CATEGORIES),
  validate(CommonValidators.idSchema),
  categoriesController.getCategoryById.bind(categoriesController),
);

// Admin-only write operations
router.post(
  "/",
  hasPermissions(Permission.CREATE_CATEGORY),
  validate(createCategorySchema),
  categoriesController.createCategory.bind(categoriesController),
);

router.put(
  "/:id",
  hasPermissions(Permission.EDIT_CATEGORY),
  validate(CommonValidators.idSchema),
  validate(updateCategorySchema),
  categoriesController.updateCategory.bind(categoriesController),
);

router.delete(
  "/:id",
  hasPermissions(Permission.DELETE_CATEGORY),
  validate(CommonValidators.idSchema),
  categoriesController.deleteCategory.bind(categoriesController),
);

export default router;
