import { NextFunction, Request, Response } from "express";
import {
  sendCreated,
  sendPaginated,
  sendSuccess,
} from "../../common/utils/response.util";
import { adsService } from "./ads.service";
import { GenerateAdBody, GetAdsQuery } from "./ads.validation";

export class AdsController {
  // Get all ads --- GET /ads
  async getAds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const query: GetAdsQuery = req.query as any;

      const result = await adsService.getAds(userId, query);

      sendPaginated(res, "Ads fetched successfully", result);
    } catch (error) {
      next(error);
    }
  }

  // Get ad by ID --- GET /ads/:id
  async getAdById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const ad = await adsService.getAdById(id, userId);

      sendSuccess(res, "Ad fetched successfully", ad);
    } catch (error) {
      next(error);
    }
  }

  // Generate ad --- POST /ads/generate
  async generateAd(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: GenerateAdBody = req.body;

      const ad = await adsService.generateAd(userId, data);

      sendCreated(res, "Ad generation queued successfully", ad);
    } catch (error) {
      next(error);
    }
  }

  // Delete ad --- DELETE /ads/:id
  async deleteAd(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await adsService.deleteAd(id, userId);

      sendSuccess(res, "Ad deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  // Bulk delete ads --- POST /ads/bulk-delete
  async bulkDeleteAds(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { ids } = req.body;

      const result = await adsService.bulkDeleteAds(userId, ids);

      sendSuccess(res, `${result.count} ads deleted successfully`, {
        count: result.count,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adsController = new AdsController();
