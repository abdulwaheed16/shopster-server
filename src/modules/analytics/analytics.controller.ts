import { NextFunction, Request, Response } from "express";
import { MESSAGES } from "../../common/constants/messages.constant";
import { sendSuccess } from "../../common/utils/response.util";
import { analyticsService } from "./analytics.service";
import { AnalyticsQuery } from "./analytics.validation";

export class AnalyticsController {
  // Get ad analytics
  async getAdAnalytics(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const query = req.query as unknown as AnalyticsQuery;

      const analytics = await analyticsService.getAdAnalytics(userId, query);

      sendSuccess(res, MESSAGES.ANALYTICS.AD_FETCHED, analytics);
    } catch (error) {
      next(error);
    }
  }

  // Get store analytics
  async getStoreAnalytics(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const query = req.query as unknown as AnalyticsQuery;

      const analytics = await analyticsService.getStoreAnalytics(userId, query);

      sendSuccess(res, MESSAGES.ANALYTICS.STORE_FETCHED, analytics);
    } catch (error) {
      next(error);
    }
  }

  // Get product analytics
  async getProductAnalytics(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const query = req.query as unknown as AnalyticsQuery;

      const analytics = await analyticsService.getProductAnalytics(
        userId,
        query
      );

      sendSuccess(res, MESSAGES.ANALYTICS.PRODUCT_FETCHED, analytics);
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
