import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { analyticsController } from "./analytics.controller";
import { analyticsQuerySchema } from "./analytics.validation";

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get(
  "/ads",
  validate(analyticsQuerySchema),
  analyticsController.getAdAnalytics.bind(analyticsController),
);

router.get(
  "/stores",
  validate(analyticsQuerySchema),
  analyticsController.getStoreAnalytics.bind(analyticsController),
);

router.get(
  "/products",
  validate(analyticsQuerySchema),
  analyticsController.getProductAnalytics.bind(analyticsController),
);

export default router;
