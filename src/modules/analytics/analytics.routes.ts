import { Router } from "express";
import { Permission } from "../../common/constants/permissions.constant";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { hasPermissions } from "../../common/middlewares/permission.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { analyticsController } from "./analytics.controller";
import { analyticsQuerySchema } from "./analytics.validation";

const router = Router();

router.use(authenticate);

router.get(
  "/ads",
  hasPermissions(Permission.VIEW_AD_ANALYTICS),
  validate(analyticsQuerySchema),
  analyticsController.getAdAnalytics.bind(analyticsController),
);

router.get(
  "/stores",
  hasPermissions(Permission.VIEW_STORE_ANALYTICS),
  validate(analyticsQuerySchema),
  analyticsController.getStoreAnalytics.bind(analyticsController),
);

router.get(
  "/products",
  hasPermissions(Permission.VIEW_PRODUCT_ANALYTICS),
  validate(analyticsQuerySchema),
  analyticsController.getProductAnalytics.bind(analyticsController),
);

export default router;
