import { NextFunction, Request, Response } from "express";
import { MESSAGES } from "../../common/constants/messages.constant";
import { sendCreated, sendSuccess } from "../../common/utils/response.util";
import { jwtConfig } from "../../config/jwt.config";
import { authService } from "./auth.service";
import {
  ChangePasswordBody,
  LoginBody,
  RefreshTokenBody,
  RegisterBody,
  RequestPasswordResetBody,
  ResetPasswordBody,
  VerifyEmailBody,
} from "./auth.validation";

export class AuthController {
  // Change password route --- POST /auth/change-password
  async changePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data: ChangePasswordBody = req.body;
      const userId = req.user!.id;

      await authService.changePassword(userId, data);

      sendSuccess(res, MESSAGES.AUTH.PASSWORD_RESET_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  // Register route --- POST /auth/register
  async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data: RegisterBody = req.body;
      const result = await authService.register(data);

      sendCreated(res, MESSAGES.AUTH.REGISTER_SUCCESS, {
        user: result.user,
        accessToken: result.tokens?.accessToken,
        refreshToken: result.tokens?.refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }

  // Login route --- POST /auth/login
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: LoginBody = req.body;
      const result = await authService.login(data);

      // Set refresh token in HTTP-only cookie
      if (result.tokens) {
        res.cookie(
          "refreshToken",
          result.tokens.refreshToken,
          jwtConfig.cookie
        );
      }

      sendSuccess(res, MESSAGES.AUTH.LOGIN_SUCCESS, {
        user: result.user,
        accessToken: result.tokens?.accessToken,
        refreshToken: result.tokens?.refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }

  // Refresh token route --- POST /auth/refresh
  async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data: RefreshTokenBody = req.body;
      const result = await authService.refreshToken(data);

      sendSuccess(res, MESSAGES.AUTH.TOKEN_REFRESHED, result);
    } catch (error) {
      next(error);
    }
  }

  // Logout route --- POST /auth/logout
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Clear refresh token cookie
      res.clearCookie("refreshToken");

      sendSuccess(res, MESSAGES.AUTH.LOGOUT_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  // Verify email route --- POST /auth/verify-email
  async verifyEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data: VerifyEmailBody = req.body;
      await authService.verifyEmail(data);

      sendSuccess(res, MESSAGES.AUTH.EMAIL_VERIFIED);
    } catch (error) {
      next(error);
    }
  }

  // Request password reset route --- POST /auth/request-password-reset
  async requestPasswordReset(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data: RequestPasswordResetBody = req.body;
      await authService.requestPasswordReset(data);

      sendSuccess(res, MESSAGES.AUTH.PASSWORD_RESET_EMAIL_SENT);
    } catch (error) {
      next(error);
    }
  }

  // Reset password route --- POST /auth/reset-password
  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data: ResetPasswordBody = req.body;
      await authService.resetPassword(data);

      sendSuccess(res, MESSAGES.AUTH.PASSWORD_RESET_SUCCESS);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
