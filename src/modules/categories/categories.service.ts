import { ApiError } from "../../common/errors/api-error";
import { prisma } from "../../config/database.config";
import {
  CreateCategoryBody,
  GetCategoriesQuery,
  UpdateCategoryBody,
} from "./categories.validation";

import { Prisma } from "@prisma/client";
import { calculatePagination } from "../../common/utils/pagination.util";
import { ICategoriesService } from "./categories.types";

export class CategoriesService implements ICategoriesService {
  // Get all categories for a user (or global)
  async getCategories(userId: string, query: GetCategoriesQuery) {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const skip = (page - 1) * limit;

    const where: Prisma.CategoryWhereInput = {
      // OR: [{ userId }, { userId: null }], // User's categories or global
    };

    if (query.search) {
      where.AND = [
        where, // Keep existing userId conditions
        {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } },
          ],
        },
      ];
      delete where.OR; // Remove the original OR condition if AND is used
    }

    if (query.parentId) {
      where.parentId = query.parentId;
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        // where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { templates: { where: { isActive: true } } },
          },
        },
      }),
      prisma.category.count({ where }),
    ]);

    // Enrichment...
    const enrichedCategories = categories.map((category) => {
      const { _count, ...rest } = category as any;
      return {
        ...rest,
        templateCount: _count?.templates || 0,
      };
    });

    const finalCategories = query.withTemplatesOnly
      ? enrichedCategories.filter((cat) => cat.templateCount > 0)
      : enrichedCategories;

    // console.log("Categories", {
    //   categories,
    //   enrichedCategories,
    //   finalCategories,
    // });

    // FALLBACK: If no categories found after filtering (and no search), return mock categories
    // if (finalCategories.length === 0 && !query.search) {
    //   return {
    //     data: query.withTemplatesOnly
    //       ? mockCategories.filter((cat) => cat.templateCount > 0)
    //       : mockCategories,
    //     meta: calculatePagination(mockCategories.length, page, limit),
    //   } as any;
    // }

    return {
      data: finalCategories,
      meta: calculatePagination(total, page, limit),
    } as any;
  }

  async getCategoryById(id: string, userId: string) {
    const category = await prisma.category.findFirst({
      where: {
        id,
        OR: [{ userId }, { userId: null }],
      },
    });

    if (!category) {
      throw ApiError.notFound("Category not found");
    }

    return category;
  }

  async createCategory(userId: string, data: CreateCategoryBody) {
    const existing = await prisma.category.findFirst({
      where: { userId, slug: data.slug },
    });

    if (existing) {
      throw ApiError.badRequest(
        `Category with slug "${data.slug}" already exists`,
      );
    }

    if (data.parentId) {
      await this.getCategoryById(data.parentId, userId);
    }

    return await prisma.category.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async updateCategory(id: string, userId: string, data: UpdateCategoryBody) {
    const category = await this.getCategoryById(id, userId);

    if (category.userId !== userId) {
      throw ApiError.forbidden("Cannot update global categories");
    }

    if (data.slug) {
      const existing = await prisma.category.findFirst({
        where: {
          userId,
          slug: data.slug,
          id: { not: id },
        },
      });

      if (existing) {
        throw ApiError.badRequest(
          `Category with slug "${data.slug}" already exists`,
        );
      }
    }

    if (data.parentId) {
      await this.getCategoryById(data.parentId, userId);
    }

    return await prisma.category.update({
      where: { id },
      data,
    });
  }

  async deleteCategory(id: string, userId: string): Promise<void> {
    const category = await this.getCategoryById(id, userId);

    if (category.userId !== userId) {
      throw ApiError.forbidden("Cannot delete global categories");
    }

    const productCount = await prisma.product.count({
      where: { categoryIds: { has: id } },
    });

    if (productCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete category as it is being used by ${productCount} product(s).`,
      );
    }

    const childCount = await prisma.category.count({
      where: { parentId: id },
    });

    if (childCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete category as it has ${childCount} sub-categories.`,
      );
    }

    await prisma.category.delete({
      where: { id },
    });
  }
}

export const categoriesService = new CategoriesService();
