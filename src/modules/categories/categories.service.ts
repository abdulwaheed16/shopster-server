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
      OR: [{ userId }, { userId: null }], // User's categories or global
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
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.category.count({ where }),
    ]);

    return {
      data: categories,
      meta: calculatePagination(total, page, limit),
    };
  }

  // Get category by ID
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

  // Create category
  async createCategory(userId: string, data: CreateCategoryBody) {
    // Check if slug already exists for this user
    const existing = await prisma.category.findFirst({
      where: { userId, slug: data.slug },
    });

    if (existing) {
      throw ApiError.badRequest(
        `Category with slug "${data.slug}" already exists`
      );
    }

    // Verify parent if provided
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

  // Update category
  async updateCategory(id: string, userId: string, data: UpdateCategoryBody) {
    const category = await this.getCategoryById(id, userId);

    if (category.userId !== userId) {
      throw ApiError.forbidden("Cannot update global categories");
    }

    // Check slug uniqueness if updated
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
          `Category with slug "${data.slug}" already exists`
        );
      }
    }

    // Verify parent if provided
    if (data.parentId) {
      await this.getCategoryById(data.parentId, userId);
    }

    return await prisma.category.update({
      where: { id },
      data,
    });
  }

  // Delete category
  async deleteCategory(id: string, userId: string): Promise<void> {
    const category = await this.getCategoryById(id, userId);

    if (category.userId !== userId) {
      throw ApiError.forbidden("Cannot delete global categories");
    }

    // Check if there are products using this category
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete category as it is being used by ${productCount} product(s).`
      );
    }

    // Check for children
    const childCount = await prisma.category.count({
      where: { parentId: id },
    });

    if (childCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete category as it has ${childCount} sub-categories.`
      );
    }

    await prisma.category.delete({
      where: { id },
    });
  }
}

export const categoriesService = new CategoriesService();
