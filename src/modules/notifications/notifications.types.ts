import { Notification, NotificationType } from "@prisma/client";
import { PaginatedResponse } from "../../common/utils/pagination.util";

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export interface INotificationsService {
  createNotification(data: CreateNotificationDto): Promise<Notification>;
  getUserNotifications(
    userId: string,
    query: any
  ): Promise<PaginatedResponse<Notification>>;
  markAsRead(id: string, userId: string): Promise<Notification>;
  markAllAsRead(userId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
}
