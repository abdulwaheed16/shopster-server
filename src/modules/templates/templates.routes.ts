import { Router } from "express";
import { UserRole } from "../../common/constants/roles.constant";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { authorize } from "../../common/middlewares/role.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import * as CommonValidators from "../../common/validations/common.validation";
import { templatesController } from "./templates.controller";
import {
  bulkDeleteTemplatesSchema,
  createTemplateSchema,
  generatePreviewSchema,
  getTemplatesSchema,
  updateTemplateSchema,
} from "./templates.validation";

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get(
  "/my",
  validate(getTemplatesSchema),
  templatesController.getMyTemplates.bind(templatesController),
);

router.get(
  "/general",
  validate(getTemplatesSchema),
  templatesController.getGeneralTemplates.bind(templatesController),
);

router.get(
  "/",
  validate(getTemplatesSchema),
  templatesController.getTemplates.bind(templatesController),
);

router.post(
  "/preview",
  validate(generatePreviewSchema),
  templatesController.generatePreview.bind(templatesController),
);

router.get(
  "/:id",
  validate(CommonValidators.idSchema),
  templatesController.getTemplateById.bind(templatesController),
);

router.post(
  "/",
  authorize(UserRole.ADMIN),
  validate(createTemplateSchema),
  templatesController.createTemplate.bind(templatesController),
);

router.put(
  "/:id",
  authorize(UserRole.ADMIN),
  validate(CommonValidators.idSchema),
  validate(updateTemplateSchema),
  templatesController.updateTemplate.bind(templatesController),
);

router.put(
  "/my/:id",
  validate(CommonValidators.idSchema),
  validate(updateTemplateSchema),
  templatesController.updateMyTemplate.bind(templatesController),
);

router.delete(
  "/:id",
  authorize(UserRole.ADMIN),
  validate(CommonValidators.idSchema),
  templatesController.deleteTemplate.bind(templatesController),
);

router.delete(
  "/my/:id",
  validate(CommonValidators.idSchema),
  templatesController.deleteMyTemplate.bind(templatesController),
);

router.post(
  "/bulk-delete",
  authorize(UserRole.ADMIN),
  validate(bulkDeleteTemplatesSchema),
  templatesController.bulkDeleteTemplates.bind(templatesController),
);

// Interaction Routes
router.post(
  "/:id/visit",
  validate(CommonValidators.idSchema),
  templatesController.trackVisit.bind(templatesController),
);

router.post(
  "/:id/like",
  validate(CommonValidators.idSchema),
  templatesController.toggleLike.bind(templatesController),
);

router.post(
  "/:id/favorite",
  validate(CommonValidators.idSchema),
  templatesController.toggleFavorite.bind(templatesController),
);

// Admin Routes
router.get(
  "/admin/stats",
  authorize(UserRole.ADMIN),
  templatesController.getAdminStats.bind(templatesController),
);

export default router;
