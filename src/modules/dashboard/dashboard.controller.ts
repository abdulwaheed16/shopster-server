import { NextFunction, Request, Response } from "express";
import { MESSAGES } from "../../common/constants/messages.constant";
import { sendSuccess } from "../../common/utils/response.util";
import { dashboardService } from "./dashboard.service";

export class DashboardController {
  async getUserStats(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;

      const stats = await dashboardService.getUserStats(userId);

      sendSuccess(res, MESSAGES.DASHBOARD.STATS_FETCHED, stats);
    } catch (error) {
      next(error);
    }
  }

  async getAdminStats(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { range } = req.query;
      const days = range ? parseInt(range as string) : 30;

      const stats = await dashboardService.getAdminStats(days);

      sendSuccess(res, MESSAGES.DASHBOARD.ADMIN_STATS_FETCHED, stats);
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
