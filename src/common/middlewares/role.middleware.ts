import { NextFunction, Request, Response } from "express";
import { MESSAGES } from "../constants/messages.constant";
import { ROLE_HIERARCHY, UserRole } from "../constants/roles.constant";
import { ApiError } from "../errors/api-error";

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw ApiError.unauthorized(MESSAGES.AUTH.UNAUTHORIZED);
    }

    const userRole = req.user.role;

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(userRole)) {
      throw ApiError.forbidden(MESSAGES.AUTH.FORBIDDEN);
    }

    next();
  };
};

// Check if user has minimum role level
export const authorizeMinRole = (minRole: UserRole) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw ApiError.unauthorized(MESSAGES.AUTH.UNAUTHORIZED);
    }

    const userRoleLevel = ROLE_HIERARCHY[req.user.role];
    const minRoleLevel = ROLE_HIERARCHY[minRole];

    if (userRoleLevel < minRoleLevel) {
      throw ApiError.forbidden(MESSAGES.AUTH.FORBIDDEN);
    }

    next();
  };
};

// Check if user owns the resource or is admin
export const authorizeOwnerOrAdmin = (userIdParam: string = "userId") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw ApiError.unauthorized(MESSAGES.AUTH.UNAUTHORIZED);
    }

    const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
    const isOwner = req.user.id === resourceUserId;
    const isAdmin = req.user.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      throw ApiError.forbidden(MESSAGES.AUTH.FORBIDDEN);
    }

    next();
  };
};
