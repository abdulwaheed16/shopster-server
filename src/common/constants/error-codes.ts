/**
 * Standardized error codes for client-side handling
 * Format: CATEGORY_SUBCATEGORY_NUMBER
 */

export const ErrorCodes = {
  // Authentication errors (AUTH_xxx)
  AUTH_INVALID_CREDENTIALS: "AUTH_001",
  AUTH_TOKEN_EXPIRED: "AUTH_002",
  AUTH_TOKEN_INVALID: "AUTH_003",
  AUTH_UNAUTHORIZED: "AUTH_004",
  AUTH_FORBIDDEN: "AUTH_005",
  AUTH_EMAIL_NOT_VERIFIED: "AUTH_006",
  AUTH_USER_NOT_FOUND: "AUTH_007",
  AUTH_EMAIL_ALREADY_EXISTS: "AUTH_008",

  // Database errors (DB_xxx)
  DB_CONNECTION_ERROR: "DB_001",
  DB_QUERY_ERROR: "DB_002",
  DB_NOT_FOUND: "DB_003",
  DB_DUPLICATE_KEY: "DB_004",
  DB_VALIDATION_ERROR: "DB_005",

  // Validation errors (VAL_xxx)
  VAL_INVALID_INPUT: "VAL_001",
  VAL_MISSING_FIELD: "VAL_002",
  VAL_INVALID_FORMAT: "VAL_003",
  VAL_OUT_OF_RANGE: "VAL_004",

  // Business logic errors (BIZ_xxx)
  BIZ_INSUFFICIENT_CREDITS: "BIZ_001",
  BIZ_PLAN_LIMIT_EXCEEDED: "BIZ_002",
  BIZ_STORE_LIMIT_EXCEEDED: "BIZ_003",
  BIZ_INVALID_OPERATION: "BIZ_004",
  BIZ_RESOURCE_LOCKED: "BIZ_005",

  // External service errors (EXT_xxx)
  EXT_SHOPIFY_ERROR: "EXT_001",
  EXT_STRIPE_ERROR: "EXT_002",
  EXT_CLOUDINARY_ERROR: "EXT_003",
  EXT_EMAIL_ERROR: "EXT_004",
  EXT_AI_SERVICE_ERROR: "EXT_005",
  EXT_WEBHOOK_ERROR: "EXT_006",

  // File/Upload errors (FILE_xxx)
  FILE_TOO_LARGE: "FILE_001",
  FILE_INVALID_TYPE: "FILE_002",
  FILE_UPLOAD_FAILED: "FILE_003",

  // Rate limiting errors (RATE_xxx)
  RATE_LIMIT_EXCEEDED: "RATE_001",

  // Server errors (SRV_xxx)
  SRV_INTERNAL_ERROR: "SRV_001",
  SRV_SERVICE_UNAVAILABLE: "SRV_002",
  SRV_TIMEOUT: "SRV_003",

  // Queue/Job errors (JOB_xxx)
  JOB_FAILED: "JOB_001",
  JOB_TIMEOUT: "JOB_002",
  JOB_NOT_FOUND: "JOB_003",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Get user-friendly error message for error code
 */
export const getErrorMessage = (code: ErrorCode): string => {
  const messages: Record<ErrorCode, string> = {
    // Auth
    [ErrorCodes.AUTH_INVALID_CREDENTIALS]: "Invalid email or password",
    [ErrorCodes.AUTH_TOKEN_EXPIRED]:
      "Your session has expired. Please login again",
    [ErrorCodes.AUTH_TOKEN_INVALID]: "Invalid authentication token",
    [ErrorCodes.AUTH_UNAUTHORIZED]:
      "You must be logged in to access this resource",
    [ErrorCodes.AUTH_FORBIDDEN]:
      "You don't have permission to access this resource",
    [ErrorCodes.AUTH_EMAIL_NOT_VERIFIED]: "Please verify your email address",
    [ErrorCodes.AUTH_USER_NOT_FOUND]: "User not found",
    [ErrorCodes.AUTH_EMAIL_ALREADY_EXISTS]:
      "An account with this email already exists",

    // Database
    [ErrorCodes.DB_CONNECTION_ERROR]:
      "Database connection error. Please try again later",
    [ErrorCodes.DB_QUERY_ERROR]: "Database query error. Please try again",
    [ErrorCodes.DB_NOT_FOUND]: "Resource not found",
    [ErrorCodes.DB_DUPLICATE_KEY]: "This record already exists",
    [ErrorCodes.DB_VALIDATION_ERROR]: "Invalid data provided",

    // Validation
    [ErrorCodes.VAL_INVALID_INPUT]: "Invalid input provided",
    [ErrorCodes.VAL_MISSING_FIELD]: "Required field is missing",
    [ErrorCodes.VAL_INVALID_FORMAT]: "Invalid format",
    [ErrorCodes.VAL_OUT_OF_RANGE]: "Value is out of acceptable range",

    // Business
    [ErrorCodes.BIZ_INSUFFICIENT_CREDITS]:
      "Insufficient credits. Please upgrade your plan",
    [ErrorCodes.BIZ_PLAN_LIMIT_EXCEEDED]: "You've reached your plan limit",
    [ErrorCodes.BIZ_STORE_LIMIT_EXCEEDED]:
      "You've reached the maximum number of stores for your plan",
    [ErrorCodes.BIZ_INVALID_OPERATION]: "This operation is not allowed",
    [ErrorCodes.BIZ_RESOURCE_LOCKED]: "This resource is currently locked",

    // External
    [ErrorCodes.EXT_SHOPIFY_ERROR]: "Shopify service error. Please try again",
    [ErrorCodes.EXT_STRIPE_ERROR]: "Payment processing error. Please try again",
    [ErrorCodes.EXT_CLOUDINARY_ERROR]:
      "Image upload service error. Please try again",
    [ErrorCodes.EXT_EMAIL_ERROR]: "Email service error. Please try again",
    [ErrorCodes.EXT_AI_SERVICE_ERROR]: "AI service error. Please try again",
    [ErrorCodes.EXT_WEBHOOK_ERROR]: "Webhook processing error",

    // File
    [ErrorCodes.FILE_TOO_LARGE]: "File size exceeds the maximum allowed",
    [ErrorCodes.FILE_INVALID_TYPE]: "Invalid file type",
    [ErrorCodes.FILE_UPLOAD_FAILED]: "File upload failed. Please try again",

    // Rate limiting
    [ErrorCodes.RATE_LIMIT_EXCEEDED]:
      "Too many requests. Please try again later",

    // Server
    [ErrorCodes.SRV_INTERNAL_ERROR]: "Internal server error. Please try again",
    [ErrorCodes.SRV_SERVICE_UNAVAILABLE]:
      "Service temporarily unavailable. Please try again later",
    [ErrorCodes.SRV_TIMEOUT]: "Request timeout. Please try again",

    // Job
    [ErrorCodes.JOB_FAILED]: "Job processing failed",
    [ErrorCodes.JOB_TIMEOUT]: "Job processing timeout",
    [ErrorCodes.JOB_NOT_FOUND]: "Job not found",
  };

  return messages[code] || "An unexpected error occurred";
};
