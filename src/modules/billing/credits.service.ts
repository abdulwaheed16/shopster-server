import { UsageType } from "@prisma/client";
import { ApiError } from "../../common/errors/api-error";
import { prisma } from "../../config/database.config";
import { ICreditManager } from "./billing.types";

export class CreditsService implements ICreditManager {
  private async ensureWallet(userId: string) {
    return await prisma.creditWallet.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async addCredits(
    userId: string,
    creditAmount: number,
    type: UsageType,
    description?: string,
  ) {
    const wallet = await this.ensureWallet(userId);

    return await prisma.$transaction([
      prisma.creditWallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: creditAmount },
          lifetimeEarned: { increment: creditAmount },
        },
      }),
      prisma.usageRecord.create({
        data: {
          userId,
          walletId: wallet.id,
          type,
          creditAmount: creditAmount,
          description,
        },
      }),
    ]);
  }

  /**
   * Deduct credits from a user's wallet if the balance is sufficient.
   */
  async deductCredits(
    userId: string,
    creditAmount: number,
    type: UsageType,
    description?: string,
  ) {
    const wallet = await this.ensureWallet(userId);

    if (wallet.balance < creditAmount) {
      throw ApiError.badRequest("Insufficient credits for this operation");
    }

    return await prisma.$transaction([
      prisma.creditWallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: creditAmount },
          lifetimeSpent: { increment: creditAmount },
        },
      }),
      prisma.usageRecord.create({
        data: {
          userId,
          walletId: wallet.id,
          type,
          creditAmount: -creditAmount,
          description,
        },
      }),
    ]);
  }

  /**
   * Set absolute balance for a user's wallet (admin adjustment).
   */
  async setCredits(userId: string, creditAmount: number, description: string) {
    const wallet = await this.ensureWallet(userId);
    const delta = creditAmount - wallet.balance;

    return await prisma.$transaction([
      prisma.creditWallet.update({
        where: { id: wallet.id },
        data: {
          balance: creditAmount,
          lifetimeEarned: delta > 0 ? { increment: delta } : undefined,
        },
      }),
      prisma.usageRecord.create({
        data: {
          userId,
          walletId: wallet.id,
          type: UsageType.ADMIN_ADJUSTMENT,
          creditAmount: delta,
          description,
        },
      }),
    ]);
  }

  /**
   * Get the current wallet balance for a user.
   */
  async getBalance(userId: string): Promise<number> {
    const wallet = await this.ensureWallet(userId);
    return wallet.balance;
  }
}

export const creditsService = new CreditsService();
