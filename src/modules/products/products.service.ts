import { ApiError } from "../../common/errors/api-error";
import { prisma } from "../../config/database.config";
import {
  CreateProductBody,
  GetProductsQuery,
  UpdateProductBody,
} from "./products.validation";

import { IProductsService } from "./products.types";
import { Prisma } from "@prisma/client";
import { calculatePagination } from "../../common/utils/pagination.util";

export class ProductsService implements IProductsService {
  // Get all products for user's stores
  async getProducts(userId: string, query: GetProductsQuery) {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      store: { userId }, // Only products from user's stores
    };

    if (query.storeId) {
      where.storeId = query.storeId;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive === "true";
    }

    if (query.inStock !== undefined) {
      where.inStock = query.inStock === "true";
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { sku: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          store: {
            select: { name: true },
          },
          category: {
            select: { name: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: calculatePagination(total, page, limit),
    };
  }

  // Get product by ID
  async getProductById(id: string, userId: string) {
    const product = await prisma.product.findFirst({
      where: {
        id,
        store: { userId },
      },
      include: {
        store: true,
        category: true,
      },
    });

    if (!product) {
      throw ApiError.notFound("Product not found or you don't have access");
    }

    return product;
  }

  // Create single product
  async createProduct(userId: string, data: CreateProductBody) {
    // 1. Verify store exists and belongs to user
    const store = await prisma.store.findFirst({
      where: { id: data.storeId, userId },
    });

    if (!store) {
      throw ApiError.notFound("Store not found or you don't have access");
    }

    // 2. Create product
    return await prisma.product.create({
      data: {
        ...data,
        images: data.images as any,
        variants: data.variants as any,
      },
    });
  }

  // Update product
  async updateProduct(id: string, userId: string, data: UpdateProductBody) {
    // 1. Verify existence and ownership
    await this.getProductById(id, userId);

    // 2. Update
    return await prisma.product.update({
      where: { id },
      data: {
        ...data,
        images: data.images ? (data.images as any) : undefined,
        variants: data.variants ? (data.variants as any) : undefined,
      },
    });
  }

  // Delete product
  async deleteProduct(id: string, userId: string) {
    await this.getProductById(id, userId);

    await prisma.product.delete({
      where: { id },
    });
  }

  // Bulk create products (e.g., from sync)
  async bulkCreateProducts(userId: string, productsData: CreateProductBody[]) {
    if (!productsData.length) {
      return { count: 0, message: "No products to create" };
    }

    // We use a transaction for safety if it's a small batch
    // Or just createMany for performance
    const count = await prisma.$transaction(async (tx) => {
      let created = 0;
      for (const p of productsData) {
        await tx.product.upsert({
          where: {
            storeId_externalId: {
              storeId: p.storeId,
              externalId: p.externalId,
            },
          },
          update: {
            ...p,
            images: p.images as any,
            variants: p.variants as any,
          },
          create: {
            ...p,
            images: p.images as any,
            variants: p.variants as any,
          },
        });
        created++;
      }
      return created;
    });

    return {
      count,
      message: `Successfully synced ${count} products`,
    };
  }

  // Bulk delete products
  async bulkDeleteProducts(userId: string, ids: string[]) {
    // Verify all products belong to the user's stores
    const products = await prisma.product.findMany({
      where: {
        id: { in: ids },
        store: { userId },
      },
      select: { id: true },
    });

    const validatedIds = products.map((p) => p.id);

    if (validatedIds.length === 0) {
      return { count: 0, message: "No valid products found to delete" };
    }

    const { count } = await prisma.product.deleteMany({
      where: {
        id: { in: validatedIds },
      },
    });

    return {
      count,
      message: `Successfully deleted ${count} products`,
    };
  }
}

export const productsService = new ProductsService();

