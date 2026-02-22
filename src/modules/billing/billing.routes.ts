import { Router } from "express";
import { UserRole } from "../../common/constants/roles.constant";
import { auditLogger } from "../../common/middlewares/audit-logger.middleware";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { authorize } from "../../common/middlewares/role.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { adminBillingController } from "./admin-billing.controller";
import { billingController } from "./billing.controller";
import {
  adjustCreditsSchema,
  createCheckoutSessionSchema,
  createPlanSchema,
  createPortalSessionSchema,
  createSubscriptionSchema,
  updateCustomPlanSchema,
  updatePlanSchema,
  updateSubscriptionSchema,
  verifyPasswordSchema,
} from "./billing.validation";

const router = Router();

// ─── Public / User Routes ─────────────────────────────────────────────────────

router.get(
  "/plans",
  authenticate,
  billingController.getPlans.bind(billingController),
);
router.get(
  "/plans/:id",
  authenticate,
  billingController.getPlan.bind(billingController),
);
router.get(
  "/subscription",
  authenticate,
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
  billingController.getPaymentMethods.bind(billingController),
);

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
router.post(
  "/cancel-subscription",
  authenticate,
  billingController.cancelSubscription.bind(billingController),
);

// Stripe Webhook (no auth — verified by signature)
router.post(
  "/webhooks",
  billingController.handleWebhook.bind(billingController),
);

// ─── Admin: Plan Routes ─────────────────────────────────────────────────────────

router.get(
  "/admin/plans",
  authenticate,
  authorize(UserRole.ADMIN),
  adminBillingController.getPlans.bind(adminBillingController),
);

router.get(
  "/admin/plans/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  adminBillingController.getPlan.bind(adminBillingController),
);

router.post(
  "/admin/plans",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(createPlanSchema),
  auditLogger("CREATE_PLAN", "Plan"),
  adminBillingController.createPlan.bind(adminBillingController),
);

router.put(
  "/admin/plans/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(updatePlanSchema),
  auditLogger("UPDATE_PLAN", "Plan"),
  adminBillingController.updatePlan.bind(adminBillingController),
);

router.delete(
  "/admin/plans/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  auditLogger("DELETE_PLAN", "Plan"),
  adminBillingController.deletePlan.bind(adminBillingController),
);

// ─── Admin: Subscription Routes ─────────────────────────────────────────────────

router.get(
  "/admin/subscriptions",
  authenticate,
  authorize(UserRole.ADMIN),
  adminBillingController.getSubscriptions.bind(adminBillingController),
);

router.get(
  "/admin/subscriptions/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  adminBillingController.getSubscription.bind(adminBillingController),
);

router.get(
  "/admin/users/:userId/subscription",
  authenticate,
  authorize(UserRole.ADMIN),
  adminBillingController.getUserSubscription.bind(adminBillingController),
);

router.post(
  "/admin/subscriptions",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(createSubscriptionSchema),
  auditLogger("CREATE_SUBSCRIPTION", "Subscription"),
  adminBillingController.createSubscription.bind(adminBillingController),
);

router.put(
  "/admin/subscriptions/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(updateSubscriptionSchema),
  auditLogger("UPDATE_SUBSCRIPTION", "Subscription"),
  adminBillingController.updateSubscription.bind(adminBillingController),
);

router.delete(
  "/admin/subscriptions/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  auditLogger("CANCEL_SUBSCRIPTION", "Subscription"),
  adminBillingController.cancelSubscription.bind(adminBillingController),
);

// ─── Admin: Credits ───────────────────────────────────────────────────────────

router.post(
  "/admin/users/:userId/credits",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(adjustCreditsSchema),
  auditLogger("ADJUST_CREDITS", "CreditWallet"),
  adminBillingController.adjustCredits.bind(adminBillingController),
);

router.get(
  "/admin/users/:userId/credits",
  authenticate,
  authorize(UserRole.ADMIN),
  adminBillingController.getUserCredits.bind(adminBillingController),
);

// ─── Admin: Legacy Usage ──────────────────────────────────────────────────────

router.get(
  "/admin/usage/:userId",
  authenticate,
  authorize(UserRole.ADMIN),
  billingController.getUserUsage.bind(billingController),
);

// ─── Admin: Legacy Custom Plan (deprecated, kept for backward compat) ─────────

router.post(
  "/admin/verify-password",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(verifyPasswordSchema),
  billingController.verifyPassword.bind(billingController),
);

router.post(
  "/admin/custom-plan",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(updateCustomPlanSchema),
  auditLogger("UPDATE_CUSTOM_PLAN", "Plan"),
  billingController.updateCustomPlan.bind(billingController),
);

export default router;
