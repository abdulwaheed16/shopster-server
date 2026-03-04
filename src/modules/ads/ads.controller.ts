import { NextFunction, Request, Response } from "express";
import Logger from "../../common/logging/logger";
import {
  sendCreated,
  sendPaginated,
  sendSuccess,
} from "../../common/utils/response.util";
import { adsService } from "./ads.service";
import { n8nCallbackService } from "./n8n-callback.service";

export class AdsController {
  // ---------------------------------------------------------------------------
  // Real-time Event Streaming (SSE)
  // ---------------------------------------------------------------------------
  async streamAdEvents(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      Logger.info(`[AdsController] SSE connection established — adId=${id}`);

      res.write(
        `data: ${JSON.stringify({ status: "CONNECTED", adId: id })}\n\n`,
      );

      const unsubscribe = adsService.subscribeToAdUpdates(id, (data) => {
        if (res.writable) {
          Logger.info(
            `[AdsController] Forwarding update to client — adId=${id} status=${data.status}`,
          );
          res.write(`data: ${JSON.stringify(data)}\n\n`);
          if ((res as any).flush) (res as any).flush();
        }
      });

      const heartbeat = setInterval(() => {
        if (res.writable) {
          res.write(": heartbeat\n\n");
          if ((res as any).flush) (res as any).flush();
        }
      }, 15_000);

      req.on("close", () => {
        clearInterval(heartbeat);
        unsubscribe();
        Logger.info(`[AdsController] SSE connection closed — adId=${id}`);
      });
    } catch (error) {
      next(error);
    }
  }

  // ---------------------------------------------------------------------------
  // n8n Callback Handling
  // ---------------------------------------------------------------------------
  async handleN8nCallback(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await n8nCallbackService.handleCallback(req.body);
      sendSuccess(res, "Callback received");
    } catch (error) {
      next(error);
    }
  }

  // ---------------------------------------------------------------------------
  // Core Ad Operations
  // ---------------------------------------------------------------------------
  async getAds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adsService.getAds(
        req.user!.id,
        req.query as any,
        req.user!.role,
      );
      sendPaginated(res, "Ads fetched", result);
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
      const ad = await adsService.getAdById(req.params.id, req.user!.id);
      sendSuccess(res, "Ad fetched", ad);
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
      const ad = await adsService.generateAd(req.user!.id, req.body);
      sendCreated(res, "Ad generation started", ad);
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
      const ad = await adsService.updateAd(
        req.params.id,
        req.user!.id,
        req.body,
      );
      sendSuccess(res, "Ad updated", ad);
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
      await adsService.deleteAd(req.params.id, req.user!.id);
      sendSuccess(res, "Ad deleted");
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
      const result = await adsService.bulkDeleteAds(req.user!.id, req.body.ids);
      sendSuccess(res, `Bulk delete successful — ${result.count} ads removed`);
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
      await adsService.cancelAd(req.params.id, req.user!.id);
      sendSuccess(res, "Ad generation cancelled");
    } catch (error) {
      next(error);
    }
  }

  // ---------------------------------------------------------------------------
  // Multi-step Video Generation Operations
  // ---------------------------------------------------------------------------
  async generateVideoBaseImage(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await adsService.generateVideoBaseImage(
        req.user!.id,
        req.body,
      );
      sendSuccess(res, "Base image generation started", result);
    } catch (error) {
      next(error);
    }
  }

  async generateVideoScenes(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await adsService.generateVideoScenes(
        req.user!.id,
        req.body,
      );
      sendSuccess(res, "Scene generation started", result);
    } catch (error) {
      next(error);
    }
  }

  async generateVideoFoodScenes(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await adsService.generateVideoFoodScenes(
        req.user!.id,
        req.body,
      );
      sendSuccess(res, "Food scene generation started", result);
    } catch (error) {
      next(error);
    }
  }

  async regenerateScene(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await adsService.regenerateScene(
        req.user!.id,
        req.params.id,
        req.body,
      );
      sendSuccess(res, "Scene regeneration started", result);
    } catch (error) {
      next(error);
    }
  }

  async regenerateAllScenes(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await adsService.regenerateAllScenes(
        req.user!.id,
        req.params.id,
      );
      sendSuccess(res, "All scenes regeneration started", result);
    } catch (error) {
      next(error);
    }
  }

  async generateFinalVideo(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await adsService.generateFinalVideo(
        req.user!.id,
        req.body,
      );
      sendSuccess(res, "Final video rendering queued", result);
    } catch (error) {
      next(error);
    }
  }

  async generateVideoModelImage(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await adsService.generateVideoModelImage(
        req.user!.id,
        req.body,
      );
      sendSuccess(res, "Model image generation started", result);
    } catch (error) {
      next(error);
    }
  }
}

export const adsController = new AdsController();
