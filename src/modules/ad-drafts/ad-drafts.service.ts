import { ApiError } from "../../common/errors/api-error";
import { prisma } from "../../config/database.config";
import { UpsertAdDraftInput } from "./ad-drafts.validation";

import { IAdDraftsService } from "./ad-drafts.types";

export class AdDraftsService implements IAdDraftsService {
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
    // SUSPENDED: Paused state persistence as per requirement
    console.log(`Ad draft update suspended for user ${userId}`);
    const existing = await this.getCurrentDraft(userId);
    return existing;
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
