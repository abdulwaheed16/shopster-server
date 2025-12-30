import { ApiError } from "../../common/errors/api-error";
import { prisma } from "../../config/database.config";
import { UpsertAdDraftInput } from "./ad-drafts.validation";

export class AdDraftsService {
  // Get current draft for user
  async getCurrentDraft(userId: string) {
    const draft = await prisma.adDraft.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    return draft;
  }

  // Create or update draft
  async upsertDraft(userId: string, data: UpsertAdDraftInput) {
    // Check if draft exists
    const existing = await this.getCurrentDraft(userId);

    if (existing) {
      // Update existing draft
      const updated = await prisma.adDraft.update({
        where: { id: existing.id },
        data: {
          ...data,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      });
      return updated;
    } else {
      // Create new draft
      const draft = await prisma.adDraft.create({
        data: {
          userId,
          ...data,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      return draft;
    }
  }

  // Delete draft
  async deleteDraft(userId: string) {
    const draft = await this.getCurrentDraft(userId);

    if (!draft) {
      throw ApiError.notFound("No draft found");
    }

    await prisma.adDraft.delete({
      where: { id: draft.id },
    });
  }
}

export const adDraftsService = new AdDraftsService();
