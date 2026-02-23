import { NextFunction, Request, Response } from "express";
import { MESSAGES } from "../constants/messages.constant";
import {
  Permission,
  ROLE_PERMISSIONS,
} from "../constants/permissions.constant";
import { ApiError } from "../errors/api-error";

/**
 * Middleware to check if the authenticated user has the required permission(s)
 * @param requiredPermissions - One or more permissions required to access the route
 */
export const hasPermissions = (...requiredPermissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw ApiError.unauthorized(MESSAGES.AUTH.UNAUTHORIZED);
    }

    const userRole = req.user.role;
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasAllPermissions) {
      throw ApiError.forbidden(MESSAGES.AUTH.FORBIDDEN);
    }

    next();
  };
};

/**
 * Middleware to check if the authenticated user has ANY of the required permissions
 * @param requiredPermissions - One or more permissions, at least one is required
 */
export const hasAnyPermission = (...requiredPermissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw ApiError.unauthorized(MESSAGES.AUTH.UNAUTHORIZED);
    }

    const userRole = req.user.role;
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];

    // Check if user has at least one of the required permissions
    const hasAnyPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasAnyPermission) {
      throw ApiError.forbidden(MESSAGES.AUTH.FORBIDDEN);
    }

    next();
  };
};
