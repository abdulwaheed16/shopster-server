import { UserRole } from "./roles.constant";

/**
 * Universal permission enum for all pages and actions across the application.
 * Follows the industry-standard pattern: <ACTION>_<RESOURCE>
 */
export enum Permission {
  // ─── Dashboard ────────────────────────────────────────────────────────────
  VIEW_USER_DASHBOARD = "view_user_dashboard",
  VIEW_ADMIN_DASHBOARD = "view_admin_dashboard",
  VIEW_AGENCY_DASHBOARD = "view_agency_dashboard",

  // ─── User Management (Admin) ──────────────────────────────────────────────
  VIEW_USERS = "view_users",
  CREATE_USER = "create_user",
  EDIT_USER = "edit_user",
  DELETE_USER = "delete_user",
  CHANGE_USER_PASSWORD = "change_user_password",
  CHANGE_USER_ROLE = "change_user_role",
  VIEW_USER_DETAILS = "view_user_details",

  // ─── Ad Management ────────────────────────────────────────────────────────
  GENERATE_ADS = "generate_ads",
  VIEW_ADS = "view_ads",
  EDIT_AD = "edit_ad",
  DELETE_AD = "delete_ad",
  BULK_DELETE_ADS = "bulk_delete_ads",
  CANCEL_AD_GENERATION = "cancel_ad_generation",

  // ─── Store Management ─────────────────────────────────────────────────────
  VIEW_STORES = "view_stores",
  CREATE_STORE = "create_store",
  EDIT_STORE = "edit_store",
  DELETE_STORE = "delete_store",
  SYNC_STORE = "sync_store",

  // ─── Product Management ───────────────────────────────────────────────────
  VIEW_PRODUCTS = "view_products",
  CREATE_PRODUCT = "create_product",
  EDIT_PRODUCT = "edit_product",
  DELETE_PRODUCT = "delete_product",
  BULK_DELETE_PRODUCTS = "bulk_delete_products",
  IMPORT_PRODUCTS_CSV = "import_products_csv",
  EXPORT_PRODUCTS = "export_products",
  MANAGE_ASSET_FOLDERS = "manage_asset_folders",

  // ─── Template Management ──────────────────────────────────────────────────
  VIEW_TEMPLATES = "view_templates",
  CREATE_TEMPLATE = "create_template",
  EDIT_TEMPLATE = "edit_template",
  DELETE_TEMPLATE = "delete_template",
  BULK_DELETE_TEMPLATES = "bulk_delete_templates",
  MANAGE_OWN_TEMPLATES = "manage_own_templates",
  VIEW_TEMPLATE_ADMIN_STATS = "view_template_admin_stats",

  // ─── Billing: Plans (Admin) ───────────────────────────────────────────────
  VIEW_PLANS_ADMIN = "view_plans_admin",
  CREATE_PLAN = "create_plan",
  EDIT_PLAN = "edit_plan",
  DELETE_PLAN = "delete_plan",

  // ─── Billing: Subscriptions (Admin) ───────────────────────────────────────
  VIEW_SUBSCRIPTIONS_ADMIN = "view_subscriptions_admin",
  CREATE_SUBSCRIPTION = "create_subscription",
  EDIT_SUBSCRIPTION = "edit_subscription",
  CANCEL_SUBSCRIPTION_ADMIN = "cancel_subscription_admin",

  // ─── Billing: Credits (Admin) ─────────────────────────────────────────────
  VIEW_USER_CREDITS = "view_user_credits",
  ADJUST_USER_CREDITS = "adjust_user_credits",

  // ─── Billing: Custom Plans (Admin) ────────────────────────────────────────
  MANAGE_CUSTOM_PLAN = "manage_custom_plan",

  // ─── Billing: User Self-Service ───────────────────────────────────────────
  VIEW_BILLING_PAGE = "view_billing_page",
  VIEW_PLANS = "view_plans",
  VIEW_PRICING_PAGE = "view_pricing_page",
  MANAGE_SUBSCRIPTION = "manage_subscription",
  VIEW_INVOICES = "view_invoices",
  VIEW_PAYMENT_METHODS = "view_payment_methods",
  CREATE_CHECKOUT_SESSION = "create_checkout_session",
  CREATE_PORTAL_SESSION = "create_portal_session",

  // ─── Analytics / Reports ──────────────────────────────────────────────────
  VIEW_AD_ANALYTICS = "view_ad_analytics",
  VIEW_STORE_ANALYTICS = "view_store_analytics",
  VIEW_PRODUCT_ANALYTICS = "view_product_analytics",

  // ─── Settings ─────────────────────────────────────────────────────────────
  VIEW_PROFILE_SETTINGS = "view_profile_settings",
  EDIT_PROFILE_SETTINGS = "edit_profile_settings",
  VIEW_SECURITY_SETTINGS = "view_security_settings",
  EDIT_SECURITY_SETTINGS = "edit_security_settings",
  MANAGE_2FA = "manage_2fa",

  // ─── Feedback ─────────────────────────────────────────────────────────────
  SUBMIT_FEEDBACK = "submit_feedback",
  VIEW_OWN_FEEDBACK = "view_own_feedback",
  VIEW_ALL_FEEDBACK = "view_all_feedback",
  MANAGE_FEEDBACK = "manage_feedback",

  // ─── Categories ───────────────────────────────────────────────────────────
  VIEW_CATEGORIES = "view_categories",
  CREATE_CATEGORY = "create_category",
  EDIT_CATEGORY = "edit_category",
  DELETE_CATEGORY = "delete_category",

  // ─── Notifications ────────────────────────────────────────────────────────
  VIEW_NOTIFICATIONS = "view_notifications",
  MARK_NOTIFICATIONS_READ = "mark_notifications_read",

  // ─── Uploads ──────────────────────────────────────────────────────────────
  UPLOAD_IMAGES = "upload_images",
  UPLOAD_VIDEOS = "upload_videos",
  DELETE_UPLOAD = "delete_upload",

  // ─── Ad Drafts ────────────────────────────────────────────────────────────
  MANAGE_AD_DRAFTS = "manage_ad_drafts",
}

/**
 * Map each role to its allowed permissions.
 * ADMIN gets all permissions.
 * USER gets standard authenticated user access.
 * GUEST gets a read-only, limited set (no billing, no write ops).
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission),

  [UserRole.USER]: [
    // Dashboard
    Permission.VIEW_USER_DASHBOARD,

    // Ads
    Permission.GENERATE_ADS,
    Permission.VIEW_ADS,
    Permission.EDIT_AD,
    Permission.DELETE_AD,
    Permission.BULK_DELETE_ADS,
    Permission.CANCEL_AD_GENERATION,

    // Stores
    Permission.VIEW_STORES,
    Permission.CREATE_STORE,
    Permission.EDIT_STORE,
    Permission.DELETE_STORE,
    Permission.SYNC_STORE,

    // Products
    Permission.VIEW_PRODUCTS,
    Permission.CREATE_PRODUCT,
    Permission.EDIT_PRODUCT,
    Permission.DELETE_PRODUCT,
    Permission.BULK_DELETE_PRODUCTS,
    Permission.IMPORT_PRODUCTS_CSV,
    Permission.EXPORT_PRODUCTS,
    Permission.MANAGE_ASSET_FOLDERS,

    // Templates
    Permission.VIEW_TEMPLATES,
    Permission.MANAGE_OWN_TEMPLATES,

    // Billing — user self-service
    Permission.VIEW_BILLING_PAGE,
    Permission.VIEW_PLANS,
    Permission.VIEW_PRICING_PAGE,
    Permission.MANAGE_SUBSCRIPTION,
    Permission.VIEW_INVOICES,
    Permission.VIEW_PAYMENT_METHODS,
    Permission.CREATE_CHECKOUT_SESSION,
    Permission.CREATE_PORTAL_SESSION,

    // Analytics
    Permission.VIEW_AD_ANALYTICS,
    Permission.VIEW_STORE_ANALYTICS,
    Permission.VIEW_PRODUCT_ANALYTICS,

    // Settings
    Permission.VIEW_PROFILE_SETTINGS,
    Permission.EDIT_PROFILE_SETTINGS,
    Permission.VIEW_SECURITY_SETTINGS,
    Permission.EDIT_SECURITY_SETTINGS,
    Permission.MANAGE_2FA,

    // Feedback
    Permission.SUBMIT_FEEDBACK,
    Permission.VIEW_OWN_FEEDBACK,
  ],

  [UserRole.GUEST]: [
    // Read-only subset — no billing, no write actions
    Permission.VIEW_USER_DASHBOARD,
    Permission.VIEW_ADS,
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_STORES,
    Permission.VIEW_TEMPLATES,
    Permission.VIEW_PROFILE_SETTINGS,
    Permission.EDIT_PROFILE_SETTINGS,
    Permission.VIEW_SECURITY_SETTINGS,
    Permission.SUBMIT_FEEDBACK,
    Permission.VIEW_OWN_FEEDBACK,
  ],
};
