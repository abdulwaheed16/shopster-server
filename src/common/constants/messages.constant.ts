export const MESSAGES = {
  // Auth
  AUTH: {
    REGISTER_SUCCESS: "User registered successfully",
    LOGIN_SUCCESS: "Login successful",
    LOGOUT_SUCCESS: "Logout successful",
    TOKEN_REFRESHED: "Token refreshed successfully",
    EMAIL_VERIFIED: "Email verified successfully",
    PASSWORD_RESET_EMAIL_SENT: "Password reset email sent",
    PASSWORD_RESET_SUCCESS: "Password reset successful",
    INVALID_CREDENTIALS: "Invalid email or password",
    EMAIL_ALREADY_EXISTS: "Email already exists",
    INVALID_TOKEN: "Invalid or expired token",
    UNAUTHORIZED: "Unauthorized access",
    FORBIDDEN: "Access forbidden",
    EMAIL_NOT_VERIFIED: "Please verify your email first",
  },

  // Users
  USERS: {
    FETCHED: "Users fetched successfully",
    FETCHED_ONE: "User fetched successfully",
    UPDATED: "User updated successfully",
    DELETED: "User deleted successfully",
    NOT_FOUND: "User not found",
  },

  // Stores
  STORES: {
    CREATED: "Store created successfully",
    FETCHED: "Stores fetched successfully",
    FETCHED_ONE: "Store fetched successfully",
    UPDATED: "Store updated successfully",
    DELETED: "Store deleted successfully",
    SYNCED: "Store synced successfully",
    NOT_FOUND: "Store not found",
    SYNC_IN_PROGRESS: "Store sync already in progress",
    AUTH_INITIATED: "Auth initiated",
  },

  // Products
  PRODUCTS: {
    CREATED: "Product created successfully",
    FETCHED: "Products fetched successfully",
    FETCHED_ONE: "Product fetched successfully",
    UPDATED: "Product updated successfully",
    DELETED: "Product deleted successfully",
    NOT_FOUND: "Product not found",
  },

  // Categories
  CATEGORIES: {
    CREATED: "Category created successfully",
    FETCHED: "Categories fetched successfully",
    FETCHED_ONE: "Category fetched successfully",
    UPDATED: "Category updated successfully",
    DELETED: "Category deleted successfully",
    NOT_FOUND: "Category not found",
  },

  // Templates
  TEMPLATES: {
    CREATED: "Template created successfully",
    FETCHED: "Template fetched successfully",
    FETCHED_ONE: "Template fetched successfully",
    UPDATED: "Template updated successfully",
    DELETED: "Template deleted successfully",
    NOT_FOUND: "Template not found",
    TRACKED: "Visit tracked",
    STATS_FETCHED: "Stats fetched successfully",
    USER_FETCHED: "User templates fetched successfully",
    GLOBAL_FETCHED: "Global templates fetched successfully",
  },

  // Ads
  ADS: {
    CREATED: "Ad generation started successfully",
    FETCHED: "Ads fetched successfully",
    FETCHED_ONE: "Ad fetched successfully",
    UPDATED: "Ad updated successfully",
    DELETED: "Ad deleted successfully",
    NOT_FOUND: "Ad not found",
    GENERATION_FAILED: "Ad generation failed",
    QUEUED: "Ad generation queued successfully",
  },

  // Ad Drafts
  AD_DRAFTS: {
    CREATED: "Ad draft created successfully",
    FETCHED: "Draft fetched successfully",
    UPDATED: "Draft saved successfully",
    DELETED: "Draft deleted successfully",
    NOT_FOUND: "Ad draft not found",
  },

  // Jobs
  JOBS: {
    FETCHED: "Jobs fetched successfully",
    FETCHED_ONE: "Job fetched successfully",
    UPDATED: "Job updated successfully",
    NOT_FOUND: "Job not found",
  },

  // Analytics
  ANALYTICS: {
    AD_FETCHED: "Ad analytics retrieved successfully",
    STORE_FETCHED: "Store analytics retrieved successfully",
    PRODUCT_FETCHED: "Product analytics retrieved successfully",
  },

  // Billing
  BILLING: {
    CHECKOUT_CREATED: "Checkout session created",
    PORTAL_CREATED: "Portal session created",
    PLANS_FETCHED: "Plans retrieved successfully",
    PLAN_FETCHED: "Plan retrieved successfully",
    SUBSCRIPTION_FETCHED: "Current subscription retrieved",
    PLAN_UPDATED: "Custom plan updated successfully",
    INVOICES_FETCHED: "Invoices retrieved successfully",
    PAYMENT_METHODS_FETCHED: "Payment methods retrieved successfully",
    USAGE_FETCHED: "Usage records retrieved successfully",
    WEBHOOK_RECEIVED: "Webhook received",
  },

  // Dashboard
  DASHBOARD: {
    STATS_FETCHED: "Dashboard stats fetched successfully",
    ADMIN_STATS_FETCHED: "Admin dashboard stats fetched successfully",
  },

  // Feedback
  FEEDBACK: {
    CREATED: "Feedback submitted successfully",
    FETCHED: "Feedback fetched successfully",
    UPDATED: "Feedback status updated",
    DELETED: "Feedback deleted successfully",
  },

  // Notifications
  NOTIFICATIONS: {
    FETCHED: "Notifications fetched successfully",
    READ: "Notification marked as read",
    READ_ALL: "All notifications marked as read",
    COUNT_FETCHED: "Unread count fetched successfully",
    UPDATED: "Notification updated successfully",
    DELETED: "Notification deleted successfully",
  },

  // Settings
  SETTINGS: {
    FETCHED: "Settings fetched successfully",
    UPDATED: "Settings updated successfully",
    PROFILE_FETCHED: "Profile settings fetched successfully",
    PROFILE_UPDATED: "Profile settings updated successfully",
    SECURITY_FETCHED: "Security settings fetched successfully",
    PASSWORD_UPDATED: "Password updated successfully",
  },

  // Variables
  VARIABLES: {
    CREATED: "Variable created successfully",
    FETCHED: "Variable fetched successfully",
    USAGE_FETCHED: "Variable usage details fetched",
    UPDATED: "Variable updated successfully",
    DELETED: "Variable deleted successfully",
  },

  // AI
  AI: {
    FAL_API_KEY_MISSING: "FAL_AI_API_KEY is not configured",
    OPENAI_API_KEY_MISSING: "OPENAI_API_KEY is not configured",
    GEMINI_API_KEY_MISSING: "GEMINI_API_KEY is not configured",
    GENERATION_FAILED: "AI Generation failed",
    TEXT_GENERATION_FAILED: "AI Text generation failed",
    GEMINI_GENERATION_FAILED: "Gemini Text generation failed",
    UNSUPPORTED_PROVIDER: "Unsupported AI provider",
  },

  // Storage
  STORAGE: {
    UPLOAD_FAILED: "Storage upload failed",
    DELETE_FAILED: "Storage deletion failed",
    UPLOAD_SUCCESS: "File uploaded successfully",
    DELETE_SUCCESS: "File deleted successfully",
    NOT_CONNECTED: "Storage provider is not yet connected",
    UNSUPPORTED_PROVIDER: "Unsupported storage provider",
  },

  // General
  GENERAL: {
    INTERNAL_SERVER_ERROR: "Internal server error",
    VALIDATION_ERROR: "Validation error",
    NOT_FOUND: "Resource not found",
    BAD_REQUEST: "Bad request",
    SUCCESS: "Success",
    OK: "ok",
  },
} as const;
