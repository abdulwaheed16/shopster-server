import { NextFunction, Request, Response } from "express";
import { MESSAGES } from "../constants/messages.constant";
import { UserRole } from "../constants/roles.constant";
import { ApiError } from "../errors/api-error";
import { verifyAccessToken } from "../utils/jwt.util";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw ApiError.unauthorized(MESSAGES.AUTH.UNAUTHORIZED);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw ApiError.unauthorized(MESSAGES.AUTH.UNAUTHORIZED);
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      throw ApiError.unauthorized(MESSAGES.AUTH.INVALID_TOKEN);
    }

    // Attach user to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role as UserRole,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(ApiError.unauthorized(MESSAGES.AUTH.INVALID_TOKEN));
    }
  }
};

export const authenticateWithQuery = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // Fallback to query param
    if (!token && req.query.token && typeof req.query.token === "string") {
      token = req.query.token;
    }

    if (!token) {
      throw ApiError.unauthorized(MESSAGES.AUTH.UNAUTHORIZED);
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      throw ApiError.unauthorized(MESSAGES.AUTH.INVALID_TOKEN);
    }

    // Attach user to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role as UserRole,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(ApiError.unauthorized(MESSAGES.AUTH.INVALID_TOKEN));
    }
  }
};

// Optional authentication - doesn't throw error if no token
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);

      if (decoded) {
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role as UserRole,
        };
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};
