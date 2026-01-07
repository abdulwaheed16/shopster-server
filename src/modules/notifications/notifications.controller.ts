import { NextFunction, Request, Response } from "express";
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
      sendPaginated(res, "Notifications fetched successfully", result);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const notification = await notificationsService.markAsRead(id, userId);
      sendSuccess(res, "Notification marked as read", notification);
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      await notificationsService.markAllAsRead(userId);
      sendSuccess(res, "All notifications marked as read");
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const count = await notificationsService.getUnreadCount(userId);
      sendSuccess(res, "Unread count fetched successfully", { count });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationsController = new NotificationsController();
