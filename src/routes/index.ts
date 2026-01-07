import { Router } from "express";
import healthRoutes from "../health/health.routes";
import adDraftsRoutes from "../modules/ad-drafts/ad-drafts.routes";
import adsRoutes from "../modules/ads/ads.routes";
import analyticsRoutes from "../modules/analytics/analytics.routes";
import authRoutes from "../modules/auth/auth.routes";
import billingRoutes from "../modules/billing/billing.routes";
import categoriesRoutes from "../modules/categories/categories.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";
import feedbackRoutes from "../modules/feedback/feedback.routes";
import jobsRoutes from "../modules/jobs/jobs.routes";
import notificationsRoutes from "../modules/notifications/notifications.routes";
import productsRoutes from "../modules/products/products.routes";
import settingsRoutes from "../modules/settings/settings.routes";
import shopifyRoutes from "../modules/stores/shopify.routes";
import storesRoutes from "../modules/stores/stores.routes";
import templatesRoutes from "../modules/templates/templates.routes";
import uploadRoutes from "../modules/upload/upload.routes";
import usersRoutes from "../modules/users/users.routes";
import variablesRoutes from "../modules/variables/variables.routes";

const router = Router();

// API version prefix
const API_VERSION = "/api/v1";

// Health check (no version prefix)
router.use("/health", healthRoutes);

// Auth routes
router.use(`${API_VERSION}/auth`, authRoutes);

// Users routes
router.use(`${API_VERSION}/users`, usersRoutes);

// Dashboard routes
router.use(`${API_VERSION}/dashboard`, dashboardRoutes);

// Variables routes
router.use(`${API_VERSION}/variables`, variablesRoutes);

// Categories routes
router.use(`${API_VERSION}/categories`, categoriesRoutes);

// Store routes
router.use(`${API_VERSION}/stores`, storesRoutes);

// Product routes
router.use(`${API_VERSION}/products`, productsRoutes);

// Shopify routes
router.use(`${API_VERSION}/shopify`, shopifyRoutes);

// Template routes
router.use(`${API_VERSION}/templates`, templatesRoutes);

// Ad routes
router.use(`${API_VERSION}/ads`, adsRoutes);

// Ad Draft routes
router.use(`${API_VERSION}/ad-drafts`, adDraftsRoutes);

// Job routes (admin only)
router.use(`${API_VERSION}/jobs`, jobsRoutes);

// Analytics routes
router.use(`${API_VERSION}/analytics`, analyticsRoutes);

// Upload routes
router.use(`${API_VERSION}/upload`, uploadRoutes);

// Settings routes
router.use(`${API_VERSION}/settings`, settingsRoutes);

// Feedback routes
router.use(`${API_VERSION}/feedback`, feedbackRoutes);

// Notifications routes
router.use(`${API_VERSION}/notifications`, notificationsRoutes);

// Billing routes
router.use(`${API_VERSION}/billing`, billingRoutes);

export default router;
