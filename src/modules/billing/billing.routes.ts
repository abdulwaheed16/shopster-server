import { Router } from "express";
import { UserRole } from "../../common/constants/roles.constant";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { billingController } from "./billing.controller";
import {
  createCheckoutSessionSchema,
  createPortalSessionSchema,
  updateCustomPlanSchema,
} from "./billing.validation";
import { authorize } from "../../common/middlewares/role.middleware";

const router = Router();

// Publicly available (but protected by auth)
router.get("/plans", authenticate, billingController.getPlans);

// Checkout & Portal
router.post(
  "/create-checkout-session",
  authenticate,
  validate(createCheckoutSessionSchema),
  billingController.createCheckoutSession
);

router.post(
  "/create-portal-session",
  authenticate,
  validate(createPortalSessionSchema),
  billingController.createPortalSession
);

// Stripe Webhook (No auth, handled by signature verification in controller)
router.post("/webhooks", billingController.handleWebhook);

// Admin: Custom Plan Management
router.post(
  "/admin/custom-plan",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(updateCustomPlanSchema),
  billingController.updateCustomPlan
);

export default router;
