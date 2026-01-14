import { HTTP_STATUS } from "../constants/http-status.constant";
import { ERROR_CODES, ErrorCode } from "./error-codes";

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode;
  public readonly errors?: any[];
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errorCode: ErrorCode = ERROR_CODES.INTERNAL_SERVER_ERROR,
    errors?: any[],
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);

    // Set the prototype explicitly
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  // Static factory methods for common errors
  static badRequest(message: string, errors?: any[]): ApiError {
    return new ApiError(
      message,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INVALID_INPUT,
      errors
    );
  }

  static unauthorized(
    message: string = "Access Denied",
    errorCode?: ErrorCode
  ): ApiError {
    return new ApiError(
      message,
      HTTP_STATUS.UNAUTHORIZED,
      errorCode || ERROR_CODES.UNAUTHORIZED
    );
  }

  static forbidden(
    message: string = "Access Denied",
    errorCode?: ErrorCode
  ): ApiError {
    return new ApiError(
      message,
      HTTP_STATUS.FORBIDDEN,
      errorCode || ERROR_CODES.FORBIDDEN
    );
  }

  static notFound(
    message: string = "Resource Not Found",
    errorCode?: ErrorCode
  ): ApiError {
    return new ApiError(
      message,
      HTTP_STATUS.NOT_FOUND,
      errorCode || ERROR_CODES.RESOURCE_NOT_FOUND
    );
  }

  static conflict(
    message: string = "Resource Conflict",
    errorCode?: ErrorCode
  ): ApiError {
    return new ApiError(
      message,
      HTTP_STATUS.CONFLICT,
      errorCode || ERROR_CODES.VALIDATION_ERROR
    );
  }

  static validation(
    message: string = "Validation Error",
    errors?: any[]
  ): ApiError {
    return new ApiError(
      message,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      ERROR_CODES.VALIDATION_ERROR,
      errors
    );
  }

  static internal(message: string = "Internal server error"): ApiError {
    return new ApiError(
      message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      undefined,
      false // Not operational
    );
  }

  static tooManyRequests(message: string = "Too many requests"): ApiError {
    return new ApiError(
      message,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      ERROR_CODES.RATE_LIMIT_EXCEEDED
    );
  }
}
