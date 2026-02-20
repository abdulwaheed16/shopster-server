import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import * as CommonValidators from "../../common/validations/common.validation";
import { categoriesController } from "./categories.controller";
import {
  createCategorySchema,
  getCategoriesSchema,
  updateCategorySchema,
} from "./categories.validation";

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get(
  "/",
  validate(getCategoriesSchema),
  categoriesController.getCategories.bind(categoriesController)
);

router.get(
  "/:id",
  validate(CommonValidators.idSchema),
  categoriesController.getCategoryById.bind(categoriesController)
);

router.post(
  "/",
  validate(createCategorySchema),
  categoriesController.createCategory.bind(categoriesController)
);

router.put(
  "/:id",
  validate(CommonValidators.idSchema),
  validate(updateCategorySchema),
  categoriesController.updateCategory.bind(categoriesController)
);

router.delete(
  "/:id",
  validate(CommonValidators.idSchema),
  categoriesController.deleteCategory.bind(categoriesController)
);


export default router;
