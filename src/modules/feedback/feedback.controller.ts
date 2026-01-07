import { NextFunction, Request, Response } from "express";
import { ApiError } from "../../common/errors/api-error";
import {
  sendCreated,
  sendPaginated,
  sendSuccess,
} from "../../common/utils/response.util";
import { feedbackService } from "./feedback.service";
import {
  CreateFeedbackBody,
  UpdateFeedbackStatusBody,
} from "./feedback.validation";

export class FeedbackController {
  async submitFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data: CreateFeedbackBody = req.body;
      const feedback = await feedbackService.submitFeedback(userId, data);
      sendCreated(res, "Feedback submitted successfully", feedback);
    } catch (error) {
      next(error);
    }
  }

  async getAllFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user!.role !== "ADMIN")
        throw ApiError.unauthorized("Only admins can access all feedback");
      const result = await feedbackService.getAllFeedback(req.query);
      sendPaginated(res, "Feedback fetched successfully", result);
    } catch (error) {
      next(error);
    }
  }

  async getFeedbackById(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user!.role !== "ADMIN")
        throw ApiError.unauthorized("Only admins can access specific feedback");
      const { id } = req.params;
      const feedback = await feedbackService.getFeedbackById(id);
      sendSuccess(res, "Feedback fetched successfully", feedback);
    } catch (error) {
      next(error);
    }
  }

  async updateFeedbackStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user!.role !== "ADMIN")
        throw ApiError.unauthorized("Only admins can update feedback status");
      const { id } = req.params;
      const data: UpdateFeedbackStatusBody = req.body;
      const feedback = await feedbackService.updateFeedbackStatus(id, data);
      sendSuccess(res, "Feedback status updated", feedback);
    } catch (error) {
      next(error);
    }
  }

  async getMyFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const feedback = await feedbackService.getUserFeedback(userId);
      sendSuccess(res, "Your feedback fetched successfully", feedback);
    } catch (error) {
      next(error);
    }
  }
}

export const feedbackController = new FeedbackController();
