import { ApiError } from "../../../common/errors/api-error";
import { prisma } from "../../../config/database.config";
import {
  CreateProductBody,
  GetProductsQuery,
  UpdateProductBody,
} from "../products.validation";

import { Prisma } from "@prisma/client";
import { calculatePagination } from "../../../common/utils/pagination.util";

export class StoreProductsService {
  // Get all products for user's stores
  async getProducts(userId: string, query: GetProductsQuery) {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const skip = (page - 1) * limit;
    const source = query.source || "ALL";

    // Define base filters
    const where: Prisma.ProductWhereInput = {};

    // Source filtering
    if (source === "STORE") {
      where.productSource = "STORE";
      where.store = { userId };
    } else if (source === "UPLOADED") {
      where.productSource = "UPLOADED";
      where.userId = userId;
    } else {
      // source === "ALL"
      where.OR = [
        { productSource: "STORE", store: { userId } },
        { productSource: "UPLOADED", userId },
      ];
    }

    const isRoot =
      !query.folderId || query.folderId === "root" || query.folderId === "null";

    if (isRoot) {
      where.folderId = { equals: null };
    } else {
      where.folderId = query.folderId;
    }

    if (query.storeId) {
      where.storeId = query.storeId;
    }

    if (query.categoryIds && query.categoryIds.length > 0) {
      where.categoryIds = { hasSome: query.categoryIds };
    } else if (query.categoryId) {
      where.categoryIds = { has: query.categoryId };
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive === "true";
    } else {
      where.isActive = true;
    }

    if (query.search) {
      const searchFilter = { contains: query.search, mode: "insensitive" };
      where.AND = [
        ...((where.AND as any[]) || []),
        {
          OR: [
            { title: searchFilter },
            { description: searchFilter },
            { sku: searchFilter },
          ],
        },
      ];
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = {
      createdAt: query.sortBy === "oldest" ? "asc" : "desc",
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          store: { select: { name: true } },
          categories: { select: { id: true, name: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Format products for consistent frontend usage
    const formattedProducts = products.map((p) => ({
      ...p,
      store: p.store || { name: "Manual Upload" },
    }));

    return {
      data: formattedProducts,
      meta: calculatePagination(total, page, limit),
    };
  }

  // Get product by ID
  async getProductById(id: string, userId: string) {
    const product = await prisma.product.findFirst({
      where: {
        id,
        OR: [{ store: { userId } }, { userId }],
      },
      include: {
        store: true,
        categories: true,
      },
    });

    if (!product) {
      throw ApiError.notFound("Product not found or you don't have access");
    }

    return product;
  }

  // Create single product
  async createProduct(userId: string, data: CreateProductBody) {
    // 1. Verify storeId is provided
    if (!data.storeId) {
      throw ApiError.badRequest("storeId is required for store products");
    }

    // 2. Verify store exists
    const store = await prisma.store.findUnique({
      where: { id: data.storeId },
    });

    if (!store) {
      throw ApiError.notFound("Store not found");
    }

    // 2. Ownership Check: Only bypass for ADMIN
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN" && store.userId !== userId) {
      throw ApiError.forbidden("You don't have access to this store");
    }

    // 3. Prepare data
    const productData = {
      ...data,
      userId: store.userId, // Map product to the store owner
      externalId:
        data.externalId ||
        `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      images: data.images as any,
      variants: data.variants as any,
    };

    // 3. Create product
    return await prisma.product.create({
      data: productData,
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

  // Delete product (Soft Delete)
  async deleteProduct(id: string, userId: string) {
    await this.getProductById(id, userId);

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Bulk create products (e.g., from sync)
  async bulkCreateProducts(userId: string, productsData: CreateProductBody[]) {
    if (!productsData.length) {
      return { count: 0, message: "No products to create" };
    }

    const count = await prisma.$transaction(async (tx) => {
      let created = 0;
      const data = productsData.map((p) => ({
        ...p,
        externalId:
          p.externalId ||
          `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        images: p.images as any,
        variants: p.variants as any,
      }));

      for (const p of data) {
        await tx.product.upsert({
          where: {
            storeId_externalId: {
              storeId: p.storeId as string,
              externalId: p.externalId,
            },
          },
          update: p,
          create: p,
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
    const products = await prisma.product.findMany({
      where: {
        id: { in: ids },
        OR: [{ store: { userId } }, { userId }],
      },
      select: { id: true },
    });

    const validatedIds = products.map((p) => p.id);

    if (validatedIds.length === 0) {
      return { count: 0, message: "No valid products found to delete" };
    }

    const { count } = await prisma.product.updateMany({
      where: {
        id: { in: validatedIds },
      },
      data: { isActive: false },
    });

    return {
      count,
      message: `Successfully deleted ${count} products`,
    };
  }
}

export const storeProductsService = new StoreProductsService();
