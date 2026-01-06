import { ApiError } from "../../common/errors/api-error";
import { prisma } from "../../config/database.config";
import { ICreditManager } from "./billing.types";

export class CreditsService implements ICreditManager {
  /**
   * Add credits to a user and create a usage record
   */
  async addCredits(
    userId: string,
    amount: number,
    type: any,
    description?: string
  ) {
    return await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          credits: { increment: amount },
        },
      }),
      prisma.usageRecord.create({
        data: {
          userId,
          type,
          creditAmount: amount,
          description,
        },
      }),
    ]);
  }

  /**
   * Deduct credits from a user if they have enough balance
   */
  async deductCredits(
    userId: string,
    amount: number,
    type: any,
    description?: string
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    if (user.credits < amount) {
      throw ApiError.badRequest("Insufficient credits for this operation");
    }

    return await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          credits: { decrement: amount },
        },
      }),
      prisma.usageRecord.create({
        data: {
          userId,
          type,
          creditAmount: -amount,
          description,
        },
      }),
    ]);
  }

  /**
   * Set absolute credits for a user (useful for admin adjustments)
   */
  async setCredits(userId: string, amount: number, description: string) {
    return await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          credits: amount,
        },
      }),
      prisma.usageRecord.create({
        data: {
          userId,
          type: "ADMIN_ADJUSTMENT",
          creditAmount: amount,
          description,
        },
      }),
    ]);
  }
}

export const creditsService = new CreditsService();
