import { NextFunction, Request, Response } from "express";
import { MESSAGES } from "../../common/constants/messages.constant";
import { sendSuccess } from "../../common/utils/response.util";
import { adDraftsService } from "./ad-drafts.service";
import { UpsertAdDraftInput } from "./ad-drafts.validation";

export class AdDraftsController {
  async getCurrentDraft(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;

      const draft = await adDraftsService.getCurrentDraft(userId);

      sendSuccess(res, MESSAGES.AD_DRAFTS.FETCHED, draft);
    } catch (error) {
      next(error);
    }
  }

  async upsertDraft(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: UpsertAdDraftInput = req.body;

      const draft = await adDraftsService.upsertDraft(userId, data);

      sendSuccess(res, MESSAGES.AD_DRAFTS.UPDATED, draft);
    } catch (error) {
      next(error);
    }
  }

  async deleteDraft(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;

      await adDraftsService.deleteDraft(userId);

      sendSuccess(res, MESSAGES.AD_DRAFTS.DELETED);
    } catch (error) {
      next(error);
    }
  }
}

export const adDraftsController = new AdDraftsController();
