import { ApiError } from "../../common/errors/api-error";
import { PaginatedResult } from "../../common/types/pagination.types";
import { prisma } from "../../config/database.config";
import {
  CreateVariableInput,
  GetVariablesQuery,
  UpdateVariableInput,
} from "./variables.validation";

export class VariablesService {
  // Get all variables for a user
  async getVariables(
    userId: string,
    query: GetVariablesQuery
  ): Promise<PaginatedResult<any>> {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "10");
    const skip = (page - 1) * limit;

    const where: any = { userId };

    // Filter by type
    if (query.type) {
      where.type = query.type;
    }

    // Search by name or label
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { label: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [variables, total] = await Promise.all([
      prisma.variable.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.variable.count({ where }),
    ]);

    return {
      data: variables,
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

  // Get variable by ID
  async getVariableById(id: string, userId: string) {
    const variable = await prisma.variable.findFirst({
      where: { id, userId },
    });

    if (!variable) {
      throw ApiError.notFound("Variable not found");
    }

    return variable;
  }

  // Get variable usage details
  async getVariableUsage(id: string, userId: string) {
    const variable = await this.getVariableById(id, userId);
    return {
      variable: {
        id: variable.id,
        name: variable.name,
        label: variable.label,
      },
      usageCount: variable.usageCount,
      usedInTemplates: variable.usedInTemplates,
    };
  }

  // Create new variable
  async createVariable(userId: string, data: CreateVariableInput) {
    // Check if variable with same name already exists for this user
    const existing = await prisma.variable.findFirst({
      where: { userId, name: data.name },
    });

    if (existing) {
      throw ApiError.badRequest(
        `Variable with name "${data.name}" already exists`
      );
    }

    const variable = await prisma.variable.create({
      data: {
        ...data,
        userId,
      },
    });

    return variable;
  }

  // Update variable
  async updateVariable(id: string, userId: string, data: UpdateVariableInput) {
    await this.getVariableById(id, userId); // Check ownership

    // If updating name, check for duplicates
    if (data.name) {
      const existing = await prisma.variable.findFirst({
        where: {
          userId,
          name: data.name,
          id: { not: id },
        },
      });

      if (existing) {
        throw ApiError.badRequest(
          `Variable with name "${data.name}" already exists`
        );
      }
    }

    const variable = await prisma.variable.update({
      where: { id },
      data,
    });

    return variable;
  }

  // Delete variable
  async deleteVariable(id: string, userId: string) {
    const variable = await this.getVariableById(id, userId);

    // Check if variable is being used
    if (variable.usageCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete variable "${variable.name}" as it is being used in ${variable.usageCount} template(s). Please remove it from templates first.`
      );
    }

    await prisma.variable.delete({
      where: { id },
    });
  }

  // Update variable usage (called by Template service)
  async updateVariableUsage(
    variableId: string,
    templateId: string,
    templateName: string,
    prompt: string,
    previewUrl?: string
  ) {
    const variable = await prisma.variable.findUnique({
      where: { id: variableId },
    });

    if (!variable) {
      return; // Variable doesn't exist, skip
    }

    // Check if this template is already in the usage list
    const existingUsage = variable.usedInTemplates.find(
      (usage: any) => usage.templateId === templateId
    );

    let updatedUsages;
    if (existingUsage) {
      // Update existing usage
      updatedUsages = variable.usedInTemplates.map((usage: any) =>
        usage.templateId === templateId
          ? { templateId, templateName, prompt, previewUrl }
          : usage
      );
    } else {
      // Add new usage
      updatedUsages = [
        ...variable.usedInTemplates,
        { templateId, templateName, prompt, previewUrl },
      ];
    }

    await prisma.variable.update({
      where: { id: variableId },
      data: {
        usageCount: updatedUsages.length,
        usedInTemplates: updatedUsages,
      },
    });
  }

  // Remove variable usage (called by Template service)
  async removeVariableUsage(variableId: string, templateId: string) {
    const variable = await prisma.variable.findUnique({
      where: { id: variableId },
    });

    if (!variable) {
      return; // Variable doesn't exist, skip
    }

    const updatedUsages = variable.usedInTemplates.filter(
      (usage: any) => usage.templateId !== templateId
    );

    await prisma.variable.update({
      where: { id: variableId },
      data: {
        usageCount: updatedUsages.length,
        usedInTemplates: updatedUsages,
      },
    });
  }
}

export const variablesService = new VariablesService();
