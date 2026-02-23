import { Router } from "express";
import { Permission } from "../../common/constants/permissions.constant";
import {
  authenticate,
  authenticateWithQuery,
} from "../../common/middlewares/auth.middleware";
import { validateN8nSecret } from "../../common/middlewares/n8n-callback.middleware";
import { hasPermissions } from "../../common/middlewares/permission.middleware";
import { sseMiddleware } from "../../common/middlewares/sse.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import * as CommonValidators from "../../common/validations/common.validation";
import { adsController } from "./ads.controller";
import {
  bulkDeleteAdsSchema,
  generateAdSchema,
  getAdsSchema,
} from "./ads.validation";

const router = Router();

// SSE route with unified middleware for headers and CORS
router.get(
  "/:id/events",
  sseMiddleware,
  authenticateWithQuery,
  adsController.streamAdEvents.bind(adsController),
);

// n8n Callback route — protected by the validateN8nSecret middleware
router.post(
  "/n8n-callback",
  validateN8nSecret,
  adsController.handleN8nCallback.bind(adsController),
);

// All other routes require authentication via header
router.use(authenticate);

router.post(
  "/generate",
  validate(generateAdSchema),
  adsController.generateAd.bind(adsController),
);

router.get(
  "/",
  hasPermissions(Permission.VIEW_ADS),
  validate(getAdsSchema),
  adsController.getAds.bind(adsController),
);

router.post(
  "/bulk-delete",
  hasPermissions(Permission.BULK_DELETE_ADS),
  validate(bulkDeleteAdsSchema),
  adsController.bulkDeleteAds.bind(adsController),
);

router.get(
  "/:id",
  hasPermissions(Permission.VIEW_ADS),
  validate(CommonValidators.idSchema),
  adsController.getAdById.bind(adsController),
);

router.post(
  "/:id/cancel",
  hasPermissions(Permission.CANCEL_AD_GENERATION),
  validate(CommonValidators.idSchema),
  adsController.cancelAd.bind(adsController),
);

router.patch(
  "/:id",
  hasPermissions(Permission.EDIT_AD),
  validate(CommonValidators.idSchema),
  adsController.updateAd.bind(adsController),
);

router.delete(
  "/:id",
  hasPermissions(Permission.DELETE_AD),
  validate(CommonValidators.idSchema),
  adsController.deleteAd.bind(adsController),
);

export default router;
