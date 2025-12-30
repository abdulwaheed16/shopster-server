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
    FETCHED: "Templates fetched successfully",
    FETCHED_ONE: "Template fetched successfully",
    UPDATED: "Template updated successfully",
    DELETED: "Template deleted successfully",
    NOT_FOUND: "Template not found",
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
  },

  // Ad Drafts
  AD_DRAFTS: {
    CREATED: "Ad draft created successfully",
    FETCHED: "Ad draft fetched successfully",
    UPDATED: "Ad draft updated successfully",
    DELETED: "Ad draft deleted successfully",
    NOT_FOUND: "Ad draft not found",
  },

  // Jobs
  JOBS: {
    FETCHED: "Jobs fetched successfully",
    FETCHED_ONE: "Job fetched successfully",
    UPDATED: "Job updated successfully",
    NOT_FOUND: "Job not found",
  },

  // General
  GENERAL: {
    INTERNAL_SERVER_ERROR: "Internal server error",
    VALIDATION_ERROR: "Validation error",
    NOT_FOUND: "Resource not found",
    BAD_REQUEST: "Bad request",
  },
} as const;
