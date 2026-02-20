import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
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
  validate(getVariablesSchema),
  variablesController.getVariables.bind(variablesController),
);

router.get(
  "/:id",
  validate(CommonValidators.idSchema),
  variablesController.getVariableById.bind(variablesController),
);

router.get(
  "/:id/usage",
  validate(CommonValidators.idSchema),
  variablesController.getVariableUsage.bind(variablesController),
);

router.post(
  "/",
  validate(createVariableSchema),
  variablesController.createVariable.bind(variablesController),
);

router.put(
  "/:id",
  validate(CommonValidators.idSchema),
  validate(updateVariableSchema),
  variablesController.updateVariable.bind(variablesController),
);

router.delete(
  "/:id",
  validate(CommonValidators.idSchema),
  variablesController.deleteVariable.bind(variablesController),
);

export default router;
