import { ApiError } from "../../common/errors/api-error";
import { calculatePagination } from "../../common/utils/pagination.util";
import { prisma } from "../../config/database.config";
import { notificationsService } from "../notifications/notifications.service";
import {
  CreateFeedbackBody,
  UpdateFeedbackStatusBody,
} from "./feedback.validation";

export class FeedbackService {
  async submitFeedback(userId: string, data: CreateFeedbackBody) {
    return prisma.feedback.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async getAllFeedback(query: any) {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      }),
      prisma.feedback.count({ where }),
    ]);

    return {
      data: items,
      meta: calculatePagination(total, page, limit),
    };
  }

  async getFeedbackById(id: string) {
    const feedback = await prisma.feedback.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });
    if (!feedback) throw ApiError.notFound("Feedback not found");
    return feedback;
  }

  async updateFeedbackStatus(id: string, data: UpdateFeedbackStatusBody) {
    const feedback = await prisma.feedback.update({
      where: { id },
      data: {
        status: data.status,
        adminNotes: data.adminNotes,
      },
    });

    await notificationsService.createNotification({
      userId: feedback.userId,
      type: "FEEDBACK_RESPONSE",
      title: "Feedback Updated",
      message: `Your feedback "${
        feedback.subject
      }" has been marked as ${data.status.toLowerCase()}.`,
      link: "/dashboard/feedback",
    });

    return feedback;
  }

  async getUserFeedback(userId: string) {
    return prisma.feedback.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const feedbackService = new FeedbackService();
