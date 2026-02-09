import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { config } from "../../config/env.config";
import { logError } from "../../config/logger.config";
import { HTTP_STATUS } from "../constants/http-status.constant";
import { ApiError } from "./api-error";
import { ERROR_CODES } from "./error-codes";

export const errorHandler = (
  err: Error,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void => {
  // Default error
  let error = err;

  // Convert known errors to ApiError
  if (!(error instanceof ApiError)) {
    // Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      error = handlePrismaError(error);
    }
    // Zod validation errors
    else if (error instanceof ZodError) {
      error = handleZodError(error);
    }
    // Generic errors
    else {
      error = new ApiError(
        error.message || "Internal server error",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        undefined,
        false,
      );
    }
  }

  const apiError = error as ApiError;

  // Log error with Winston
  logError(apiError.message, apiError, {
    statusCode: apiError.statusCode,
    errorCode: apiError.errorCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.id,
    errors: apiError.errors,
  });

  // Send error response
  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    errorCode: apiError.errorCode,
    ...(apiError.errors && { errors: apiError.errors }),
    ...(config.server.isDevelopment && { stack: apiError.stack }),
  });
};

// Handle Prisma errors
const handlePrismaError = (
  error: Prisma.PrismaClientKnownRequestError,
): ApiError => {
  switch (error.code) {
    case "P2002":
      // Unique constraint violation
      const field = (error.meta?.target as string[])?.join(", ") || "field";
      return ApiError.conflict(
        `${field} already exists`,
        ERROR_CODES.VALIDATION_ERROR,
      );

    case "P2025":
      // Record not found
      return ApiError.notFound("Resource not found");

    case "P2003":
      // Foreign key constraint violation
      return ApiError.badRequest("Invalid reference to related resource");

    case "P2014":
      // Required relation violation
      return ApiError.badRequest("Required relation is missing");

    default:
      return ApiError.internal("Database error occurred");
  }
};

// Handle Zod validation errors
const handleZodError = (error: ZodError): ApiError => {
  const errors = error.issues.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));

  return ApiError.validation("Validation failed", errors);
};

// Handle unhandled promise rejections
export const handleUnhandledRejection = (
  reason: Error,
  promise: Promise<any>,
) => {
  logError("Unhandled Promise Rejection", reason, {
    promise: promise.toString(),
    errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
  });
  // In production, you might want to log this to an external service
  process.exit(1);
};

// Handle uncaught exceptions
export const handleUncaughtException = (error: Error) => {
  logError("Uncaught Exception", error, {
    errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
  });
  // In production, you might want to log this to an external service
  process.exit(1);
};
