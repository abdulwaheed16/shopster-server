import { ApiError } from "../../common/errors/api-error";
import { calculatePagination } from "../../common/utils/pagination.util";
import { prisma } from "../../config/database.config";
import { CreateNotificationDto } from "./notifications.types";

export class NotificationsService {
  async createNotification(data: CreateNotificationDto) {
    return prisma.notification.create({
      data,
    });
  }

  async getUserNotifications(userId: string, query: any) {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (query.isRead !== undefined) {
      where.isRead = query.isRead === "true";
    }

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      data: items,
      meta: calculatePagination(total, page, limit),
    };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) throw ApiError.notFound("Notification not found");

    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}

export const notificationsService = new NotificationsService();
