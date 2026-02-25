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

import { Prisma } from "@prisma/client";

import { calculatePagination } from "../../common/utils/pagination.util";
import { ITemplatesService } from "./templates.types";

export class TemplatesService implements ITemplatesService {
  // Get all templates for a user
  async getTemplates(userId: string, query: GetTemplatesQuery) {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const skip = (page - 1) * limit;

    // 1. Check User Role (Admin vs User)
    const isAdmin = await prisma.user
      .findUnique({
        where: { id: userId },
        select: { role: true },
      })
      .then((u) => u?.role === "ADMIN");

    // 2. Build Base Access Control Filter (RBAC)
    // ADMIN: Sees everything
    // USER: Sees own OR public templates
    const accessFilter: Prisma.TemplateWhereInput = isAdmin
      ? {}
      : {
          OR: [{ userId }, { isPublic: true }],
        };

    const where: Prisma.TemplateWhereInput = {
      ...(isAdmin ? {} : { isActive: true }),
      AND: [accessFilter],
    };

    // 3. Apply Specialized Tab/Filter logic
    if (query.filterType === "mine") {
      where.userId = userId;
    } else if (query.filterType === "others") {
      // "General" / "Global" templates
      where.isPublic = true;
    } else if (query.filterType === "liked") {
      const likes = await prisma.templateLike.findMany({
        where: { userId },
        select: { templateId: true },
      });
      where.id = { in: likes.map((l) => l.templateId) };
    } else if (query.filterType === "favorited") {
      const favorites = await prisma.templateFavorite.findMany({
        where: { userId },
        select: { templateId: true },
      });
      where.id = { in: favorites.map((f) => f.templateId) };
    } else if (query.filterType === "recent") {
      const visits = await prisma.templateVisit.findMany({
        where: { userId },
        orderBy: { visitedAt: "desc" },
        take: 50,
        select: { templateId: true },
      });
      const uniqueIds = Array.from(new Set(visits.map((v) => v.templateId)));
      where.id = { in: uniqueIds };
    } else if (query.filterType === "uncategorised") {
      where.categoryIds = { isEmpty: true };
    }

    // 4. Dynamic Filters (Search, Category, Media Type)
    if (query.search) {
      where.AND = [
        ...(where.AND ? (where.AND as any[]) : []),
        {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } },
          ],
        },
      ];
    }

    if (query.categoryIds && query.categoryIds.length > 0) {
      where.AND = [
        ...(where.AND ? (where.AND as any[]) : []),
        { categoryIds: { hasSome: query.categoryIds } },
      ];
    } else if (query.categoryId) {
      where.AND = [
        ...(where.AND ? (where.AND as any[]) : []),
        { categoryIds: { has: query.categoryId } },
      ];
    }

    if (query.mediaType) {
      where.mediaType = query.mediaType as any;
    }

    const orderBy: any = {};
    orderBy[query.sortBy || "createdAt"] = "desc";

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          description: true,
          mediaType: true,
          previewImages: true,
          referenceAdImage: true,
          isPublic: true,
          userId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          likesCount: true,
          visitsCount: true,
          usageCount: true,
          variableIds: true,
          categoryIds: true,
          promptTemplate: true,
          productImage: true,
          _count: {
            select: { likes: true, favorites: true, visits: true },
          },
        },
      }),
      prisma.template.count({ where }),
    ]);

    // Optimize variable fetching...
    const allVariableIds = Array.from(
      new Set(templates.flatMap((t: any) => t.variableIds)),
    );
    const resolvedVariables = await prisma.variable.findMany({
      where: { id: { in: allVariableIds } },
      select: {
        id: true,
        name: true,
        label: true,
        type: true,
        required: true,
      },
    });

    const variableMap = resolvedVariables.reduce((acc: any, v) => {
      acc[v.id] = v;
      return acc;
    }, {});

    // 5. Batch fetch interactions for the current user
    const [userLikes, userFavorites] = await Promise.all([
      prisma.templateLike.findMany({
        where: { userId, templateId: { in: templates.map((t) => t.id) } },
        select: { templateId: true },
      }),
      prisma.templateFavorite.findMany({
        where: { userId, templateId: { in: templates.map((t) => t.id) } },
        select: { templateId: true },
      }),
    ]);

    const likedSet = new Set(userLikes.map((l) => l.templateId));
    const favoritedSet = new Set(userFavorites.map((f) => f.templateId));

    const enhancedTemplates = templates.map((t: any) => ({
      ...t,
      variables: t.variableIds
        .map((vid: string) => variableMap[vid])
        .filter(Boolean),
      isLiked: likedSet.has(t.id),
      isFavorited: favoritedSet.has(t.id),
    }));

    // FALLBACK: If no templates found after enrichment/filtering (and no search), return mock templates
    // if (enhancedTemplates.length === 0 && !query.search) {
    //   // Filter by category if requested
    //   let filteredMock = mockTemplates as any[];
    //   if (query.categoryIds && query.categoryIds.length > 0) {
    //     filteredMock = (mockTemplates as any[]).filter((t) =>
    //       query.categoryIds?.some((id) => t.categoryIds.includes(id)),
    //     );
    //   } else if (query.categoryId) {
    //     filteredMock = (mockTemplates as any[]).filter((t) =>
    //       t.categoryIds.includes(query.categoryId!),
    //     );
    //   }

    //   // Filter by mediaType if requested
    //   if (query.mediaType) {
    //     filteredMock = filteredMock.filter(
    //       (t) => t.mediaType === query.mediaType,
    //     );
    //   }

    //   return {
    //     data: filteredMock,
    //     meta: calculatePagination(filteredMock.length, page, limit),
    //   } as any;
    // }

    return {
      data: enhancedTemplates,
      meta: calculatePagination(total, page, limit),
    } as any;
  }

  // Get template by ID
  async getTemplateById(id: string, userId: string) {
    const template = await prisma.template.findFirst({
      where: {
        id,
        OR: [{ userId }, { userId: null }, { isPublic: true }],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
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

    const result = {
      ...template,
      variables,
      isLiked: !!isLiked,
      isFavorited: !!isFavorited,
    };

    // Strip internal analysis fields (Optimization/Privacy)
    delete (result as any).referenceAnalysis;
    delete (result as any).previewAnalyses;

    return result;
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
    const [topVisited, topLiked, topUsed, counts] = await Promise.all([
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
      prisma.template.groupBy({
        by: ["mediaType", "isPublic"],
        _count: { _all: true },
      }),
    ]);

    // Format counts for easier consumption
    const summary = {
      total: counts.reduce((acc, c) => acc + c._count._all, 0),
      public: counts
        .filter((c) => c.isPublic)
        .reduce((acc, c) => acc + c._count._all, 0),
      image: counts
        .filter((c) => c.mediaType === "IMAGE")
        .reduce((acc, c) => acc + c._count._all, 0),
      video: counts
        .filter((c) => c.mediaType === "VIDEO")
        .reduce((acc, c) => acc + c._count._all, 0),
    };

    return {
      topVisited,
      topLiked,
      topUsed,
      summary,
    };
  }

  // Create template
  async createTemplate(userId: string, data: CreateTemplateBody) {
    // 1. Sanitize variableIds: filter out those that aren't valid 24-char hex ObjectIds
    // This prevents "Malformed ObjectID" crashes
    let validVariableIds = (data.variableIds || []).filter((id) =>
      /^[0-9a-fA-F]{24}$/.test(id),
    );

    // 2. Handle inline variable creation if provided
    if ((data as any).variables && Array.isArray((data as any).variables)) {
      const inlineVariables = (data as any).variables;
      for (const v of inlineVariables) {
        // If ID is missing or invalid, it's likely a new variable from frontend
        if (!v.id || !/^[0-9a-fA-F]{24}$/.test(v.id)) {
          try {
            const newVar = await variablesService.createVariable(userId, {
              name: v.name,
              label: v.label,
              type: v.type,
              placeholder: v.placeholder,
              defaultValue: v.defaultValue,
              required: v.required,
              validation: v.validation,
            });
            if (!validVariableIds.includes(newVar.id)) {
              validVariableIds.push(newVar.id);
            }
          } catch (error) {
            console.error(`Failed to create inline variable ${v.name}:`, error);
            // Continue with other variables
          }
        } else {
          // It's an existing variable ID, make sure it's in the list
          if (!validVariableIds.includes(v.id)) {
            validVariableIds.push(v.id);
          }
        }
      }
    }

    // Clean up internal fields before creating template
    const {
      variables,
      previewImage,
      categoryId,
      categoryIds,
      assignedUserId,
      assignedUserIds,
      ...restData
    } = data as any;

    // Map previewImage (singular/deprecated) to previewImages (plural/actual) if needed
    if (previewImage && !restData.previewImages) {
      restData.previewImages = Array.isArray(previewImage)
        ? previewImage
        : [previewImage];
    }

    // Debug logging for categoryIds
    console.log(
      "[Template Creation] categoryIds from request:",
      data.categoryIds,
    );
    console.log(
      "[Template Creation] Full data:",
      JSON.stringify(data, null, 2),
    );

    const template = await prisma.template.create({
      data: {
        ...restData,
        userId,
        variableIds: validVariableIds,
        categoryIds: data.categoryIds || [],
        assignedUserIds: data.assignedUserIds || [],
      },
    });

    console.log(
      "[Template Created] Template ID:",
      template.id,
      "categoryIds:",
      template.categoryIds,
    );

    await this.updateVariableUsages(
      template.id,
      template.variableIds,
      template.name,
      template.promptTemplate,
    );
    return template;
  }

  // Update template
  // Update template
  async updateTemplate(id: string, userId: string, data: UpdateTemplateBody) {
    const where: Prisma.TemplateWhereInput = { id };
    // Admin override (no strict userId check in where)

    const existing = await prisma.template.findFirst({ where });
    if (!existing)
      throw ApiError.notFound("Template not found or access denied");

    const { previewImage, categoryId, categoryIds, assignedUserId, ...cleanData } =
      data as any;
    if (previewImage && !cleanData.previewImages) {
      cleanData.previewImages = Array.isArray(previewImage)
        ? previewImage
        : [previewImage];
    }

    if (categoryId) {
      cleanData.categories = {
        set: [{ id: categoryId }],
      };
    }

    // Handle assigned user mapping and public status
    if (cleanData.isPublic === true) {
      cleanData.assignedUserIds = [];
    } else if (assignedUserId) {
      cleanData.assignedUserIds = [assignedUserId];
    }

    const updated = await prisma.template.update({
      where: { id },
      data: cleanData,
    });
    if (data.variableIds || data.name || data.promptTemplate) {
      await this.updateVariableUsages(
        updated.id,
        updated.variableIds,
        updated.name,
        updated.promptTemplate,
        updated.previewImages?.[0],
      );
    }
    return updated;
  }

  // Update user's own template (Strict Ownership)
  async updateUserTemplate(
    id: string,
    userId: string,
    data: UpdateTemplateBody,
  ) {
    // Strict check: must match id AND userId
    const where: Prisma.TemplateWhereInput = { id, userId };

    const existing = await prisma.template.findFirst({ where });
    if (!existing)
      throw ApiError.notFound("Template not found or you do not own it");

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
        updated.previewImages?.[0],
      );
    }
    return updated;
  }

  // Delete template
  async deleteTemplate(id: string, userId: string): Promise<void> {
    const where: Prisma.TemplateWhereInput = { id };

    const template = await prisma.template.findFirst({ where });
    if (!template) throw ApiError.notFound("Template not found");

    for (const variableId of template.variableIds) {
      await variablesService.removeVariableUsage(variableId, template.id);
    }
    await prisma.template.delete({
      where: { id },
    });
  }

  // Delete user's own template (Strict Ownership)
  async deleteUserTemplate(id: string, userId: string): Promise<void> {
    const where: Prisma.TemplateWhereInput = { id, userId };

    const template = await prisma.template.findFirst({ where });
    if (!template)
      throw ApiError.notFound("Template not found or you do not own it");

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
    let promptTemplate: string;
    let referenceAdImage: string | undefined;
    let productImage: string | undefined;
    let templateId: string | undefined = data.templateId;

    if (data.templateId) {
      const template = await prisma.template.findFirst({
        where: { id: data.templateId, userId },
      });
      if (!template) throw ApiError.notFound("Template not found");
      promptTemplate = template.promptTemplate;
      referenceAdImage = template.referenceAdImage || undefined;
      productImage = template.productImage || undefined;
    } else {
      // Unsaved template preview
      if (!data.promptTemplate) {
        throw ApiError.badRequest(
          "promptTemplate is required for unsaved previews",
        );
      }
      promptTemplate = data.promptTemplate;
      referenceAdImage = data.referenceAdImage;
      productImage = data.productImage;
    }

    await billingService.checkAndDeductCredits(
      userId,
      0.5,
      "TEMPLATE_PREVIEW",
      `Preview generation for template: ${data.templateId ? "Existing" : "New draft"}`,
    );

    await templatePreviewQueue.add("generate-preview", {
      templateId,
      userId,
      promptTemplate,
      referenceAdImage,
      productImage,
      variables: data.variables, // Pass variables for dynamic injection if needed
    });

    return {
      message: "Preview generation queued successfully",
      templateId,
    };
  }

  // Helper: Update variable usages
  private async updateVariableUsages(
    templateId: string,
    variableIds: string[],
    templateName: string,
    prompt: string,
    previewUrl?: string,
  ) {
    for (const variableId of variableIds) {
      await variablesService.updateVariableUsage(
        variableId,
        templateId,
        templateName as any,
        prompt,
        previewUrl,
      );
    }
  }
}

export const templatesService = new TemplatesService();
