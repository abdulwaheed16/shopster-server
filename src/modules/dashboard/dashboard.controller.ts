import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../common/utils/response.util";
import { dashboardService } from "./dashboard.service";

export class DashboardController {
  // Get user dashboard stats --- GET /dashboard
  async getUserStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;

      const stats = await dashboardService.getUserStats(userId);

      sendSuccess(res, "Dashboard stats fetched successfully", stats);
    } catch (error) {
      next(error);
    }
  }

  // Get admin dashboard stats --- GET /dashboard/admin
  async getAdminStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await dashboardService.getAdminStats();

      sendSuccess(res, "Admin dashboard stats fetched successfully", stats);
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
