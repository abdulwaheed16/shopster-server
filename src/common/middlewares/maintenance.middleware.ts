import { NextFunction, Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.constant";
import { prisma } from "../../config/database.config";
import { UserRole } from "../constants/roles.constant";
import { ApiError } from "../errors/api-error";

/**
 * Middleware to check if the application is in maintenance mode.
 * Admins are exempted from maintenance mode restrictions.
 */
export const maintenanceMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const settings = await prisma.appSettings.findFirst();

    // If no settings found, assume not in maintenance mode
    if (!settings || !settings.isMaintenanceMode) {
      return next();
    }

    // Allow Admins to bypass maintenance mode
    if (req.user && req.user.role === UserRole.ADMIN) {
      return next();
    }

    // Exempt login/auth routes from maintenance mode to allow admin login
    const isAuthRoute = req.path.startsWith("/api/v1/auth");
    const isSettingsAppRoute = req.path.startsWith("/api/v1/settings/app");

    if (isAuthRoute || isSettingsAppRoute) {
      return next();
    }

    throw new ApiError(
      settings.maintenanceMessage ||
        "System is under maintenance. Please try again later.",
      HTTP_STATUS.SERVICE_UNAVAILABLE,
    );
  } catch (error) {
    next(error);
  }
};
