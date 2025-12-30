import { ApiError } from "../../common/errors/api-error";
import { PaginatedResult } from "../../common/types/pagination.types";
import { prisma } from "../../config/database.config";
import { templatePreviewQueue } from "../../config/queue.config";
import { billingService } from "../billing/billing.service";
import { variablesService } from "../variables/variables.service";
import {
  CreateTemplateInput,
  GeneratePreviewInput,
  GetTemplatesQuery,
  UpdateTemplateInput,
} from "./templates.validation";

export class TemplatesService {
  // Get all templates for a user
  async getTemplates(
    userId: string,
    query: GetTemplatesQuery
  ): Promise<PaginatedResult<any>> {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.categoryId) {
      where.categoryIds = { has: query.categoryId };
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
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  // Get template by ID with variables
  async getTemplateById(id: string, userId: string) {
    const template = await prisma.template.findFirst({
      where: { id, userId },
    });

    if (!template) {
      throw ApiError.notFound("Template not found");
    }

    // Fetch variable details
    const variables = await prisma.variable.findMany({
      where: {
        id: { in: template.variableIds },
      },
    });

    return {
      ...template,
      variables,
    };
  }

  // Create template
  async createTemplate(userId: string, data: CreateTemplateInput) {
    const template = await prisma.template.create({
      data: {
        ...data,
        userId,
      },
    });

    // Update variable usage
    await this.updateVariableUsages(
      template.id,
      template.variableIds,
      template.name,
      template.promptTemplate
    );

    return template;
  }

  // Update template
  async updateTemplate(id: string, userId: string, data: UpdateTemplateInput) {
    const template = await prisma.template.findFirst({
      where: { id, userId },
    });

    if (!template) {
      throw ApiError.notFound("Template not found or unauthorized");
    }

    const updated = await prisma.template.update({
      where: { id },
      data,
    });

    // Update variable usage if variableIds changed
    if (data.variableIds) {
      await this.updateVariableUsages(
        updated.id,
        updated.variableIds,
        updated.name,
        updated.promptTemplate,
        updated.previewImages[0]
      );
    }

    return updated;
  }

  // Delete template
  async deleteTemplate(id: string, userId: string) {
    const template = await prisma.template.findFirst({
      where: { id, userId },
    });

    if (!template) {
      throw ApiError.notFound("Template not found or unauthorized");
    }

    // Remove from variable usage
    for (const variableId of template.variableIds) {
      await variablesService.removeVariableUsage(variableId, id);
    }

    await prisma.template.delete({
      where: { id },
    });
  }

  // Bulk delete templates
  async bulkDeleteTemplates(userId: string, ids: string[]) {
    // Verify ownership of all templates
    const templates = await prisma.template.findMany({
      where: {
        id: { in: ids },
        userId,
      },
    });

    if (templates.length !== ids.length) {
      throw ApiError.unauthorized(
        "One or more templates not found or unauthorized"
      );
    }

    // Remove from variable usage for all templates
    for (const template of templates) {
      for (const variableId of template.variableIds) {
        await variablesService.removeVariableUsage(variableId, template.id);
      }
    }

    // Delete all templates
    const result = await prisma.template.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return {
      count: result.count,
      message: `Successfully deleted ${result.count} templates`,
    };
  }

  // Generate preview (add to queue)
  async generatePreview(userId: string, data: GeneratePreviewInput) {
    const template = await this.getTemplateById(data.templateId, userId);

    // Deduct credits (0.5 credits per preview)
    await billingService.checkAndDeductCredits(
      userId,
      0.5,
      "TEMPLATE_PREVIEW",
      `Preview generation for template: ${template.name}`
    );

    // Add job to queue
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
