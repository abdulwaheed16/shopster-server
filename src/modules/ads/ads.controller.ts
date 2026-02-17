import { NextFunction, Request, Response } from "express";
import { MESSAGES } from "../../common/constants/messages.constant";
import {
  sendCreated,
  sendPaginated,
  sendSuccess,
} from "../../common/utils/response.util";
import { adsService } from "./ads.service";
import { GetAdsQuery } from "./ads.validation";
import { GenerateAdPayload } from "./interfaces/generate-ad.interface";

export class AdsController {
  // Get all ads --- GET /ads
  async getAds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const query: GetAdsQuery = req.query as any;

      const result = await adsService.getAds(userId, query);

      sendPaginated(res, MESSAGES.ADS.FETCHED, result);
    } catch (error) {
      next(error);
    }
  }

  // Get ad by ID --- GET /ads/:id
  async getAdById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const ad = await adsService.getAdById(id, userId);

      sendSuccess(res, MESSAGES.ADS.FETCHED_ONE, ad);
    } catch (error) {
      next(error);
    }
  }

  // Generate ad --- POST /ads/generate
  async generateAd(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: GenerateAdPayload = req.body;

      const ad = await adsService.generateAd(userId, data);

      sendCreated(res, MESSAGES.ADS.QUEUED, ad);
    } catch (error) {
      next(error);
    }
  }

  // Update ad --- PATCH /ads/:id
  async updateAd(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const data = req.body;

      const ad = await adsService.updateAd(id, userId, data);

      sendSuccess(res, MESSAGES.ADS.UPDATED, ad);
    } catch (error) {
      next(error);
    }
  }

  // Delete ad --- DELETE /ads/:id
  async deleteAd(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await adsService.deleteAd(id, userId);

      sendSuccess(res, MESSAGES.ADS.DELETED);
    } catch (error) {
      next(error);
    }
  }

  // Bulk delete ads --- POST /ads/bulk-delete
  async bulkDeleteAds(
    req: Request,
    res: Response,
    next: NextFunction,
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

  // Cancel ad generation --- POST /ads/:id/cancel
  async cancelAd(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await adsService.cancelAd(id, userId);

      sendSuccess(res, MESSAGES.ADS.CANCELLED || "Ad generation cancelled");
    } catch (error) {
      next(error);
    }
  }

  // Stream ad events (SSE) --- GET /ads/:id/events
  async streamAdEvents(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      console.log(`[SSE] streamAdEvents hit for ad ${id}`);

      // Set headers explicitly and immediately
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": req.headers.origin || "*",
        "X-Accel-Buffering": "no",
      });

      // Send initial data immediately to "lock in" the content-type
      res.write(
        `data: ${JSON.stringify({ status: "CONNECTED", adId: id })}\n\n`,
      );

      // Subscribe to updates
      const unsubscribe = adsService.subscribeToAdUpdates(id, (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      });

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        res.write(": heartbeat\n\n");
      }, 30000);

      console.log("Ad events subscription established for ad:", id);

      // Handle client disconnect
      req.on("close", () => {
        clearInterval(heartbeat);
        unsubscribe();
        res.end();
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adsController = new AdsController();
