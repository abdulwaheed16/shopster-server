import { NextFunction, Request, Response } from "express";
import { MESSAGES } from "../../common/constants/messages.constant";
import Logger from "../../common/logging/logger";
import {
  sendCreated,
  sendPaginated,
  sendSuccess,
} from "../../common/utils/response.util";
import { N8NCallbackPayload } from "../ai/interfaces/n8n-callback.types";
import { adsService } from "./ads.service";
import { GenerateAdBody, GetAdsQuery } from "./ads.validation";
import { n8nCallbackService } from "./n8n-callback.service";

export class AdsController {
  async getAds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const query = req.query as unknown as GetAdsQuery;

      const result = await adsService.getAds(userId, query);

      sendPaginated(res, MESSAGES.ADS.FETCHED, result);
    } catch (error) {
      next(error);
    }
  }

  async getAdById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const ad = await adsService.getAdById(id as string, userId);

      sendSuccess(res, MESSAGES.ADS.FETCHED_ONE, ad);
    } catch (error) {
      next(error);
    }
  }

  async generateAd(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = req.body as GenerateAdBody;

      const ad = await adsService.generateAd(userId, data);

      sendCreated(res, MESSAGES.ADS.QUEUED, ad);
    } catch (error) {
      next(error);
    }
  }

  async updateAd(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const data = req.body;

      const ad = await adsService.updateAd(id as string, userId, data);

      sendSuccess(res, MESSAGES.ADS.UPDATED, ad);
    } catch (error) {
      next(error);
    }
  }

  async deleteAd(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await adsService.deleteAd(id as string, userId);

      sendSuccess(res, MESSAGES.ADS.DELETED);
    } catch (error) {
      next(error);
    }
  }

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

  async streamAdEvents(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      Logger.info(`[SSE] streamAdEvents hit for ad ${id}`);

      // Send initial event immediately to "lock in" the content-type
      res.write(
        `data: ${JSON.stringify({ status: "CONNECTED", adId: id })}\n\n`,
      );

      // Subscribe to ad-specific updates
      const unsubscribe = adsService.subscribeToAdUpdates(id, (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      });

      // Keep connection alive with a periodic heartbeat
      const heartbeat = setInterval(() => {
        res.write(": heartbeat\n\n");
      }, 15_000);

      Logger.info("SSE-Heartbeat: " + heartbeat);

      Logger.info(`Ad events subscription established for ad: ${id}`);

      // Clean up on client disconnect
      req.on("close", () => {
        clearInterval(heartbeat);
        unsubscribe();
        res.end();
      });
    } catch (error) {
      next(error);
    }
  }

  async handleN8nCallback(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const payload = req.body as N8NCallbackPayload;
      await n8nCallbackService.handleCallback(payload);
      sendSuccess(res, "Callback received and processed");
    } catch (error) {
      next(error);
    }
  }
}

export const adsController = new AdsController();
