import { Router } from "express";
import { UserRole } from "../../common/constants/roles.constant";
import { auditLogger } from "../../common/middlewares/audit-logger.middleware";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { authorize } from "../../common/middlewares/role.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { billingController } from "./billing.controller";
import {
  createCheckoutSessionSchema,
  createPortalSessionSchema,
  updateCustomPlanSchema,
} from "./billing.validation";

const router = Router();

// Publicly available (but protected by auth)
router.get("/plans", authenticate, billingController.getPlans);

router.get(
  "/subscription",
  authenticate,
  auditLogger("GET_SUBSCRIPTION", "Subscription"),
  billingController.getCurrentSubscription.bind(billingController),
);

router.get(
  "/invoices",
  authenticate,
  billingController.getInvoices.bind(billingController),
);
router.get(
  "/payment-methods",
  authenticate,
  auditLogger("GET_PAYMENT_METHODS", "Payment Method"),
  billingController.getPaymentMethods.bind(billingController),
);

// Checkout & Portal
router.post(
  "/create-checkout-session",
  authenticate,
  validate(createCheckoutSessionSchema),
  auditLogger("CREATE_CHECKOUT_SESSION", "Checkout Session"),
  billingController.createCheckoutSession.bind(billingController),
);

router.post(
  "/create-portal-session",
  authenticate,
  validate(createPortalSessionSchema),
  billingController.createPortalSession.bind(billingController),
);

// Stripe Webhook (No auth, handled by signature verification in controller)
router.post(
  "/webhooks",
  billingController.handleWebhook.bind(billingController),
);

router.get(
  "/plans/:id",
  authenticate,
  billingController.getPlan.bind(billingController),
);
router.post(
  "/cancel-subscription",
  authenticate,
  billingController.cancelSubscription.bind(billingController),
);

// Admin: Custom Plan Management
router.post(
  "/admin/custom-plan",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(updateCustomPlanSchema),
  auditLogger("UPDATE_CUSTOM_PLAN", "Plan"),
  billingController.updateCustomPlan.bind(billingController),
);

router.get(
  "/admin/usage/:userId",
  authenticate,
  authorize(UserRole.ADMIN),
  billingController.getUserUsage.bind(billingController),
);

export default router;
