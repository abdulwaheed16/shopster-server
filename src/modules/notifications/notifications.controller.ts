import { NextFunction, Request, Response } from "express";
import { MESSAGES } from "../../common/constants/messages.constant";
import { sendPaginated, sendSuccess } from "../../common/utils/response.util";
import { notificationsService } from "./notifications.service";

export class NotificationsController {
  async getMyNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await notificationsService.getUserNotifications(
        userId,
        req.query
      );
      sendPaginated(res, MESSAGES.NOTIFICATIONS.FETCHED, result);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const notification = await notificationsService.markAsRead(id, userId);
      sendSuccess(res, MESSAGES.NOTIFICATIONS.READ, notification);
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      await notificationsService.markAllAsRead(userId);
      sendSuccess(res, MESSAGES.NOTIFICATIONS.READ_ALL);
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const count = await notificationsService.getUnreadCount(userId);
      sendSuccess(res, MESSAGES.NOTIFICATIONS.COUNT_FETCHED, { count });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationsController = new NotificationsController();
