import { Router } from "express";
import { Permission } from "../../common/constants/permissions.constant";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { hasPermissions } from "../../common/middlewares/permission.middleware";
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
  hasPermissions(Permission.CREATE_TEMPLATE),
  validate(createTemplateSchema),
  templatesController.createTemplate.bind(templatesController),
);

router.put(
  "/:id",
  hasPermissions(Permission.EDIT_TEMPLATE),
  validate(updateTemplateSchema.merge(CommonValidators.idSchema)),
  templatesController.updateTemplate.bind(templatesController),
);

router.put(
  "/my/:id",
  validate(updateTemplateSchema.merge(CommonValidators.idSchema)),
  templatesController.updateMyTemplate.bind(templatesController),
);

router.delete(
  "/:id",
  hasPermissions(Permission.DELETE_TEMPLATE),
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
  hasPermissions(Permission.BULK_DELETE_TEMPLATES),
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
  hasPermissions(Permission.VIEW_TEMPLATE_ADMIN_STATS),
  templatesController.getAdminStats.bind(templatesController),
);

export default router;
