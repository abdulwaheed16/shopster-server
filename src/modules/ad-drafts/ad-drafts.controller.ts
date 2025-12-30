import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../common/utils/response.util";
import { adDraftsService } from "./ad-drafts.service";
import { UpsertAdDraftInput } from "./ad-drafts.validation";

export class AdDraftsController {
  // Get current draft --- GET /ad-drafts
  async getCurrentDraft(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;

      const draft = await adDraftsService.getCurrentDraft(userId);

      sendSuccess(res, "Draft fetched successfully", draft);
    } catch (error) {
      next(error);
    }
  }

  // Create/update draft --- POST /ad-drafts
  async upsertDraft(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: UpsertAdDraftInput = req.body;

      const draft = await adDraftsService.upsertDraft(userId, data);

      sendSuccess(res, "Draft saved successfully", draft);
    } catch (error) {
      next(error);
    }
  }

  // Delete draft --- DELETE /ad-drafts
  async deleteDraft(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;

      await adDraftsService.deleteDraft(userId);

      sendSuccess(res, "Draft deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}

export const adDraftsController = new AdDraftsController();
