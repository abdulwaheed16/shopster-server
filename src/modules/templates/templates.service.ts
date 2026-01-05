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

import { Prisma, UsageType } from "@prisma/client";
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
      // Show templates where user is explicitly assigned
      where.userId = userId;
    } else if (query.filterType === "others") {
      // Global templates (no specific user) OR system templates
      // Fetch the demo user ID to include its templates as general
      const demoUser = await prisma.user.findUnique({
        where: { email: "demo@shopster.com" },
        select: { id: true },
      });

      where.OR = [
        { userId: null },
        ...(demoUser ? [{ userId: demoUser.id }] : []),
      ];
    } else {
      // "all" - show both user's assigned and global
      where.OR = [{ userId: userId }, { userId: null }];
    }

    if (query.search) {
      const searchFilter = {
        OR: [
          {
            name: {
              contains: query.search,
              mode: "insensitive" as Prisma.QueryMode,
            },
          },
          {
            description: {
              contains: query.search,
              mode: "insensitive" as Prisma.QueryMode,
            },
          },
        ],
      };

      if (where.OR) {
        // Wrap existing OR with AND for search
        const existingOr = where.OR;
        delete where.OR;
        where.AND = [{ OR: existingOr }, searchFilter];
      } else {
        where.OR = searchFilter.OR;
      }
    }

    if (query.categoryId) {
      // Combine with existing filters
      const catFilter = {
        OR: [
          { categoryIds: { has: query.categoryId } },
          {
            category: {
              contains: query.categoryId,
              mode: "insensitive" as Prisma.QueryMode,
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

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.template.count({ where }),
    ]);

    return {
      data: templates,
      meta: calculatePagination(total, page, limit),
    };
  }

  // Get template by ID
  async getTemplateById(id: string, userId: string) {
    const template = await prisma.template.findFirst({
      where: {
        id,
        OR: [{ userId }, { userId: null }],
      },
    });

    if (!template) {
      throw ApiError.notFound("Template not found or you don't have access");
    }

    // Fetch variables manually since it's an array of IDs in Mongo
    const variables = await prisma.variable.findMany({
      where: {
        id: { in: template.variableIds },
      },
    });

    return {
      ...template,
      variables,
    } as any; // Cast to any because the return type Ad expects Template but we added variables
  }

  // Create template
  async createTemplate(userId: string, data: CreateTemplateBody) {
    // 1. Verify all variables exist and belong to user
    if (data.variableIds && data.variableIds.length > 0) {
      const vars = await prisma.variable.findMany({
        where: {
          id: { in: data.variableIds },
          userId,
        },
      });

      if (vars.length !== data.variableIds.length) {
        throw ApiError.badRequest("One or more variables not found");
      }
    }

    // 2. Create
    // Use assignedUserId if provided (admin only tool usually), otherwise default to current userId
    const finalUserId = (data as any).assignedUserId || userId;

    const template = await prisma.template.create({
      data: {
        ...data,
        userId: finalUserId,
      } as any,
    });

    // 3. Update variable usage
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
    // 1. Verify ownership
    const existing = await prisma.template.findFirst({ where: { id, userId } });
    if (!existing) throw ApiError.notFound("Template not found");

    // 2. If variables are updated, verify them
    if (data.variableIds && data.variableIds.length > 0) {
      const vars = await prisma.variable.findMany({
        where: {
          id: { in: data.variableIds },
          userId,
        },
      });

      if (vars.length !== data.variableIds.length) {
        throw ApiError.badRequest("One or more variables not found");
      }
    }

    // 3. Update
    const updated = await prisma.template.update({
      where: { id },
      data,
    });

    // 4. Update variable usage if variableIds or name/prompt changed
    if (data.variableIds || data.name || data.promptTemplate) {
      // For simplicity, update all current variables
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

    // Remove from variable usage
    for (const variableId of template.variableIds) {
      await variablesService.removeVariableUsage(variableId, template.id);
    }

    await prisma.template.delete({
      where: { id },
    });
  }

  // Bulk delete templates
  async bulkDeleteTemplates(userId: string, ids: string[]) {
    // Verify all templates belong to the user
    const templates = await prisma.template.findMany({
      where: {
        id: { in: ids },
        userId,
      },
      select: { id: true, variableIds: true },
    });

    const validatedIds = templates.map((t) => t.id);

    if (validatedIds.length === 0) {
      return { count: 0, message: "No valid templates found to delete" };
    }

    // Remove from variable usage
    for (const template of templates) {
      for (const variableId of template.variableIds) {
        await variablesService.removeVariableUsage(variableId, template.id);
      }
    }

    const { count } = await prisma.template.deleteMany({
      where: {
        id: { in: validatedIds },
      },
    });

    return {
      count,
      message: `Successfully deleted ${count} templates`,
    };
  }

  // Generate preview (n8n webhook)
  async generatePreview(userId: string, data: GeneratePreviewBody) {
    // 1. Verify existence
    const template = await prisma.template.findFirst({
      where: { id: data.templateId, userId },
    });
    if (!template) throw ApiError.notFound("Template not found");

    // 2. Check credits (0.5 credits per preview)
    await billingService.checkAndDeductCredits(
      userId,
      0.5,
      UsageType.TEMPLATE_PREVIEW,
      `Preview generation for template: ${template.name}`
    );

    // 3. Queue n8n webhook job
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
        templateName,
        prompt,
        previewUrl
      );
    }
  }
}

export const templatesService = new TemplatesService();
