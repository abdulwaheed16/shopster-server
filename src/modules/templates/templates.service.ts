import { ApiError } from "../../common/errors/api-error";
import { prisma } from "../../config/database.config";
import { templatePreviewQueue } from "../../config/queue.config";
import { billingService } from "../billing/billing.service";
import { variablesService } from "../variables/variables.service";
import {
  CreateTemplateBody,
  GeneratePreviewBody,
  GetTemplatesQuery,
  UpdateTemplateBody,
} from "./templates.validation";

import {
  Prisma,
  Template,
  TemplateFavorite,
  TemplateLike,
  TemplateVisit,
} from "@prisma/client";

import { calculatePagination } from "../../common/utils/pagination.util";
import { ITemplatesService } from "./templates.types";

export class TemplatesService implements ITemplatesService {
  // Get all templates for a user
  async getTemplates(userId: string, query: GetTemplatesQuery) {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const skip = (page - 1) * limit;

    const where: Prisma.TemplateWhereInput = { isActive: true };

    // Filtering logic
    if (query.filterType === "mine") {
      where.userId = userId;
    } else if (query.filterType === "others") {
      const demoUser = await prisma.user.findUnique({
        where: { email: "demo@shopster.com" },
        select: { id: true },
      });
      where.OR = [
        { userId: null },
        ...(demoUser ? [{ userId: demoUser.id }] : []),
      ];
    } else if (query.filterType === "liked") {
      const likes = await prisma.templateLike.findMany({
        where: { userId },
        select: { templateId: true },
      });
      where.id = { in: likes.map((l: { templateId: string }) => l.templateId) };
    } else if (query.filterType === "favorited") {
      const favorites = await prisma.templateFavorite.findMany({
        where: { userId },
        select: { templateId: true },
      });
      where.id = { in: favorites.map((f: { templateId: string }) => f.templateId) };
    } else if (query.filterType === "recent") {
      const visits = await prisma.templateVisit.findMany({
        where: { userId },
        orderBy: { visitedAt: "desc" },
        take: 50,
        select: { templateId: true },
      });
      // Get unique template IDs while maintaining order
      const uniqueIds = Array.from(
        new Set(visits.map((v: { templateId: string }) => v.templateId))
      );
      where.id = { in: uniqueIds };
    } else {
      where.OR = [{ userId: userId }, { userId: null }];
    }

    if (query.search) {
      const searchFilter = {
        OR: [
          { name: { contains: query.search, mode: "insensitive" as any } },
          {
            description: { contains: query.search, mode: "insensitive" as any },
          },
        ],
      };
      if (where.OR) {
        const existingOr = where.OR;
        delete where.OR;
        where.AND = [{ OR: existingOr }, searchFilter];
      } else {
        where.OR = searchFilter.OR;
      }
    }

    if (query.categoryId) {
      const catFilter = {
        OR: [
          { categoryIds: { has: query.categoryId } },
          {
            category: {
              contains: query.categoryId,
              mode: "insensitive" as any,
            },
          },
        ],
      };
      if (where.AND) {
        (where.AND as any[]).push(catFilter);
      } else if (where.OR) {
        const existingOr = where.OR;
        delete where.OR;
        where.AND = [{ OR: existingOr }, catFilter];
      } else {
        where.OR = catFilter.OR;
      }
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive === "true";
    }

    const orderBy: any = {};
    orderBy[query.sortBy || "createdAt"] = "desc";

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: { likes: true, favorites: true, visits: true },
          },
        },
      }),
      prisma.template.count({ where }),
    ]);

    // Enhance templates with user-specific interaction status and variables
    const enhancedTemplates = await Promise.all(
      templates.map(async (t: Template) => {
        const [isLiked, isFavorited, variables] = await Promise.all([
          prisma.templateLike.findUnique({
            where: { userId_templateId: { userId, templateId: t.id } },
          }),
          prisma.templateFavorite.findUnique({
            where: { userId_templateId: { userId, templateId: t.id } },
          }),
          prisma.variable.findMany({
            where: { id: { in: t.variableIds } },
          }),
        ]);
        return {
          ...t,
          variables,
          isLiked: !!isLiked,
          isFavorited: !!isFavorited,
        };
      })
    );

    return {
      data: enhancedTemplates,
      meta: calculatePagination(total, page, limit),
    };
  }

  // Get template by ID
  async getTemplateById(id: string, userId: string) {
    const template = await prisma.template.findFirst({
      where: {
        id,
        OR: [{ userId }, { userId: null }, { isPublic: true }] as any,
      },
      include: {
        _count: {
          select: { likes: true, favorites: true, visits: true },
        },
      },
    });

    if (!template) {
      throw ApiError.notFound("Template not found or you don't have access");
    }

    const [isLiked, isFavorited] = await Promise.all([
      prisma.templateLike.findUnique({
        where: { userId_templateId: { userId, templateId: id } },
      }),
      prisma.templateFavorite.findUnique({
        where: { userId_templateId: { userId, templateId: id } },
      }),
    ]);

    const variables = await prisma.variable.findMany({
      where: { id: { in: template.variableIds } },
    });

    return {
      ...template,
      variables,
      isLiked: !!isLiked,
      isFavorited: !!isFavorited,
    };
  }

  // Track template visit
  async trackVisit(templateId: string, userId: string) {
    await prisma.$transaction([
      prisma.templateVisit.create({
        data: { templateId, userId },
      }),
      prisma.template.update({
        where: { id: templateId },
        data: { visitsCount: { increment: 1 } },
      }),
    ]);
  }

  // Toggle template like
  async toggleLike(templateId: string, userId: string) {
    const existing = await prisma.templateLike.findUnique({
      where: { userId_templateId: { userId, templateId } },
    });

    if (existing) {
      await prisma.$transaction([
        prisma.templateLike.delete({
          where: { id: existing.id },
        }),
        prisma.template.update({
          where: { id: templateId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);
      const count = await prisma.templateLike.count({ where: { templateId } });
      return { liked: false, count };
    } else {
      await prisma.$transaction([
        prisma.templateLike.create({
          data: { userId, templateId },
        }),
        prisma.template.update({
          where: { id: templateId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);
      const count = await prisma.templateLike.count({ where: { templateId } });
      return { liked: true, count };
    }
  }

  // Toggle template favorite
  async toggleFavorite(templateId: string, userId: string) {
    const existing = await prisma.templateFavorite.findUnique({
      where: { userId_templateId: { userId, templateId } },
    });

    if (existing) {
      await prisma.templateFavorite.delete({
        where: { id: existing.id },
      });
      return { favorited: false };
    } else {
      await prisma.templateFavorite.create({
        data: { userId, templateId },
      });
      return { favorited: true };
    }
  }

  // Admin stats for templates
  async getAdminStats() {
    const [topVisited, topLiked, topUsed] = await Promise.all([
      prisma.template.findMany({
        take: 5,
        orderBy: { visitsCount: "desc" },
        select: {
          id: true,
          name: true,
          visitsCount: true,
          likesCount: true,
          usageCount: true,
        },
      }),
      prisma.template.findMany({
        take: 5,
        orderBy: { likesCount: "desc" },
        select: {
          id: true,
          name: true,
          visitsCount: true,
          likesCount: true,
          usageCount: true,
        },
      }),
      prisma.template.findMany({
        take: 5,
        orderBy: { usageCount: "desc" },
        select: {
          id: true,
          name: true,
          visitsCount: true,
          likesCount: true,
          usageCount: true,
        },
      }),
    ]);

    return {
      topVisited,
      topLiked,
      topUsed,
    };
  }

  // Create template
  async createTemplate(userId: string, data: CreateTemplateBody) {
    const finalUserId = (data as any).assignedUserId || userId;
    const template = await prisma.template.create({
      data: {
        ...data,
        userId: finalUserId,
      } as any,
    });
    await this.updateVariableUsages(
      template.id,
      template.variableIds,
      template.name,
      template.promptTemplate
    );
    return template;
  }

  // Update template
  async updateTemplate(id: string, userId: string, data: UpdateTemplateBody) {
    const existing = await prisma.template.findFirst({ where: { id, userId } });
    if (!existing) throw ApiError.notFound("Template not found");
    const updated = await prisma.template.update({
      where: { id },
      data,
    });
    if (data.variableIds || data.name || data.promptTemplate) {
      await this.updateVariableUsages(
        updated.id,
        updated.variableIds,
        updated.name,
        updated.promptTemplate,
        updated.previewImages?.[0]
      );
    }
    return updated;
  }

  // Delete template
  async deleteTemplate(id: string, userId: string): Promise<void> {
    const template = await prisma.template.findFirst({ where: { id, userId } });
    if (!template) throw ApiError.notFound("Template not found");
    for (const variableId of template.variableIds) {
      await variablesService.removeVariableUsage(variableId, template.id);
    }
    await prisma.template.delete({
      where: { id },
    });
  }

  // Bulk delete templates
  async bulkDeleteTemplates(userId: string, ids: string[]) {
    const templates = await prisma.template.findMany({
      where: { id: { in: ids }, userId },
      select: { id: true, variableIds: true },
    });
    const validatedIds = (templates as any[]).map((t: any) => t.id);
    if (validatedIds.length === 0)
      return { count: 0, message: "No valid templates found to delete" };
    for (const template of templates) {
      for (const variableId of template.variableIds) {
        await variablesService.removeVariableUsage(variableId, template.id);
      }
    }
    const { count } = await prisma.template.deleteMany({
      where: { id: { in: validatedIds } },
    });
    return { count, message: `Successfully deleted ${count} templates` };
  }

  // Generate preview (n8n webhook)
  async generatePreview(userId: string, data: GeneratePreviewBody) {
    const template = await prisma.template.findFirst({
      where: { id: data.templateId, userId },
    });
    if (!template) throw ApiError.notFound("Template not found");
    await billingService.checkAndDeductCredits(
      userId,
      0.5,
      "TEMPLATE_PREVIEW",
      `Preview generation for template: ${template.name}`
    );
    await templatePreviewQueue.add("generate-preview", {
      templateId: template.id,
      userId,
      promptTemplate: template.promptTemplate,
      referenceAdImage: template.referenceAdImage,
      productImage: template.productImage,
    });
    return {
      message: "Preview generation queued successfully",
      templateId: template.id,
    };
  }

  // Helper: Update variable usages
  private async updateVariableUsages(
    templateId: string,
    variableIds: string[],
    templateName: string,
    prompt: string,
    previewUrl?: string
  ) {
    for (const variableId of variableIds) {
      await variablesService.updateVariableUsage(
        variableId,
        templateId,
        templateName as any,
        prompt,
        previewUrl
      );
    }
  }
}

export const templatesService = new TemplatesService();
