import { NextFunction, Request, Response } from "express";
import { MESSAGES } from "../../common/constants/messages.constant";
import { sendCreated, sendSuccess } from "../../common/utils/response.util";
import { jwtConfig } from "../../config/jwt.config";
import { authService } from "./auth.service";
import {
  ChangePasswordBody,
  LoginBody,
  RegisterBody,
  RequestPasswordResetBody,
  ResetPasswordBody,
  VerifyEmailBody,
} from "./auth.validation";

export class AuthController {
  async changePassword(
    req: Request,
    res: Response,
    next: NextFunction,
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

  async register(
    req: Request,
    res: Response,
    next: NextFunction,
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

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: LoginBody = req.body;
      const result = await authService.login(data);

      // Set refresh token in HTTP-only cookie
      if (result.tokens) {
        res.cookie(
          "refreshToken",
          result.tokens.refreshToken,
          jwtConfig.cookie,
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

  async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

      if (!refreshToken) {
        sendSuccess(res, MESSAGES.AUTH.INVALID_TOKEN, null, 401);
        return;
      }

      const result = await authService.refreshToken({ refreshToken });

      sendSuccess(res, MESSAGES.AUTH.TOKEN_REFRESHED, result);
    } catch (error) {
      next(error);
    }
  }

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

  async verifyEmail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data: VerifyEmailBody = req.body;
      await authService.verifyEmail(data);

      sendSuccess(res, MESSAGES.AUTH.EMAIL_VERIFIED);
    } catch (error) {
      next(error);
    }
  }

  async requestPasswordReset(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data: RequestPasswordResetBody = req.body;
      await authService.requestPasswordReset(data);

      sendSuccess(res, MESSAGES.AUTH.PASSWORD_RESET_EMAIL_SENT);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction,
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
