import { ApiError } from "../../common/errors/api-error";
import { PaginatedResult } from "../../common/types/pagination.types";
import { prisma } from "../../config/database.config";
import {
    CreateCategoryInput,
    GetCategoriesQuery,
    UpdateCategoryInput,
} from "./categories.validation";

export class CategoriesService {
  // Get all categories for a user (or global)
  async getCategories(
    userId: string,
    query: GetCategoriesQuery
  ): Promise<PaginatedResult<any>> {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [{ userId }, { userId: null }], // User's categories or global
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
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
        include: {
          _count: {
            select: { products: true },
          },
        },
      }),
      prisma.category.count({ where }),
    ]);

    return {
      data: categories,
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

  // Get category by ID
  async getCategoryById(id: string, userId: string) {
    const category = await prisma.category.findFirst({
      where: {
        id,
        OR: [{ userId }, { userId: null }],
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw ApiError.notFound("Category not found");
    }

    return category;
  }

  // Create category
  async createCategory(userId: string, data: CreateCategoryInput) {
    // Check for duplicate slug for this user
    const existing = await prisma.category.findFirst({
      where: { userId, slug: data.slug },
    });

    if (existing) {
      throw ApiError.badRequest(
        `Category with slug "${data.slug}" already exists`
      );
    }

    const category = await prisma.category.create({
      data: {
        ...data,
        userId,
      },
    });

    return category;
  }

  // Update category
  async updateCategory(id: string, userId: string, data: UpdateCategoryInput) {
    const category = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      throw ApiError.notFound("Category not found or unauthorized");
    }

    // Check for duplicate slug
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

    const updated = await prisma.category.update({
      where: { id },
      data,
    });

    return updated;
  }

  // Delete category
  async deleteCategory(id: string, userId: string) {
    const category = await prisma.category.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw ApiError.notFound("Category not found or unauthorized");
    }

    if (category._count.products > 0) {
      throw ApiError.badRequest(
        `Cannot delete category "${category.name}" as it has ${category._count.products} product(s)`
      );
    }

    await prisma.category.delete({
      where: { id },
    });
  }
}

export const categoriesService = new CategoriesService();
