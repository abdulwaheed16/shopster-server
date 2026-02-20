import { NextFunction, Request, Response } from "express";
import { MESSAGES } from "../../common/constants/messages.constant";
import { sendSuccess } from "../../common/utils/response.util";
import { settingsService } from "./settings.service";

export class SettingsController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await settingsService.getProfile(req.user!.id);
      sendSuccess(res, MESSAGES.SETTINGS.PROFILE_FETCHED, profile);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await settingsService.updateProfile(
        req.user!.id,
        req.body,
      );
      sendSuccess(res, MESSAGES.SETTINGS.PROFILE_UPDATED, profile);
    } catch (error) {
      next(error);
    }
  }

  async getSecurity(req: Request, res: Response, next: NextFunction) {
    try {
      const security = await settingsService.getSecuritySettings(req.user!.id);
      sendSuccess(res, MESSAGES.SETTINGS.SECURITY_FETCHED, security);
    } catch (error) {
      next(error);
    }
  }

  async updateSecurity(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await settingsService.updateSecurity(
        req.user!.id,
        req.body,
      );
      sendSuccess(res, MESSAGES.SETTINGS.PASSWORD_UPDATED, result);
    } catch (error) {
      next(error);
    }
  }

  async enable2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await settingsService.toggle2FA(req.user!.id, true);
      sendSuccess(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  async disable2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await settingsService.toggle2FA(req.user!.id, false);
      sendSuccess(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }
}

export const settingsController = new SettingsController();
