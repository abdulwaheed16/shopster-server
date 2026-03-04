import { Router } from "express";
import { Permission } from "../../common/constants/permissions.constant";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { hasPermissions } from "../../common/middlewares/permission.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import * as CommonValidators from "../../common/validations/common.validation";
import { variablesController } from "./variables.controller";
import {
  createVariableSchema,
  getVariablesSchema,
  updateVariableSchema,
} from "./variables.validation";

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get(
  "/",
  hasPermissions(Permission.VIEW_VARIABLES),
  validate(getVariablesSchema),
  variablesController.getVariables.bind(variablesController),
);

router.get(
  "/:id",
  hasPermissions(Permission.VIEW_VARIABLES),
  validate(CommonValidators.idSchema),
  variablesController.getVariableById.bind(variablesController),
);

router.get(
  "/:id/usage",
  hasPermissions(Permission.VIEW_VARIABLES),
  validate(CommonValidators.idSchema),
  variablesController.getVariableUsage.bind(variablesController),
);

router.post(
  "/",
  hasPermissions(Permission.CREATE_VARIABLE),
  validate(createVariableSchema),
  variablesController.createVariable.bind(variablesController),
);

router.put(
  "/:id",
  hasPermissions(Permission.EDIT_VARIABLE),
  validate(CommonValidators.idSchema),
  validate(updateVariableSchema),
  variablesController.updateVariable.bind(variablesController),
);

router.delete(
  "/:id",
  hasPermissions(Permission.DELETE_VARIABLE),
  validate(CommonValidators.idSchema),
  variablesController.deleteVariable.bind(variablesController),
);

export default router;
