import { ApiError } from "../../common/errors/api-error";
import { PaginatedResult } from "../../common/types/pagination.types";
import { prisma } from "../../config/database.config";
import {
  CreateProductInput,
  GetProductsQuery,
  UpdateProductInput,
} from "./products.validation";

export class ProductsService {
  // Get all products for user's stores
  async getProducts(
    userId: string,
    query: GetProductsQuery
  ): Promise<PaginatedResult<any>> {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const skip = (page - 1) * limit;

    const where: any = {
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
            select: {
              id: true,
              name: true,
              platform: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products,
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
      throw ApiError.notFound("Product not found");
    }

    return product;
  }

  // Create product (for Shopify sync)
  async createProduct(userId: string, data: CreateProductInput) {
    // Verify store ownership
    const store = await prisma.store.findFirst({
      where: {
        id: data.storeId,
        userId,
      },
    });

    if (!store) {
      throw ApiError.notFound("Store not found or unauthorized");
    }

    // Check for duplicate externalId in this store
    const existing = await prisma.product.findFirst({
      where: {
        storeId: data.storeId,
        externalId: data.externalId,
      },
    });

    if (existing) {
      throw ApiError.badRequest(
        `Product with external ID "${data.externalId}" already exists in this store`
      );
    }

    const product = await prisma.product.create({
      data: {
        ...data,
      },
    });

    return product;
  }

  // Update product
  async updateProduct(id: string, userId: string, data: UpdateProductInput) {
    await this.getProductById(id, userId);

    const updated = await prisma.product.update({
      where: { id },
      data,
    });

    return updated;
  }

  // Delete product
  async deleteProduct(id: string, userId: string) {
    await this.getProductById(id, userId);

    await prisma.product.delete({
      where: { id },
    });
  }

  // Bulk create products (for Shopify sync)
  async bulkCreateProducts(userId: string, products: CreateProductInput[]) {
    // Verify store ownership for all products
    const storeIds = [...new Set(products.map((p) => p.storeId))];
    const stores = await prisma.store.findMany({
      where: {
        id: { in: storeIds },
        userId,
      },
    });

    if (stores.length !== storeIds.length) {
      throw ApiError.unauthorized(
        "One or more stores not found or unauthorized"
      );
    }

    // Get existing products for these stores to avoid duplicates
    // Since MongoDB doesn't support skipDuplicates in createMany
    const externalIds = products.map((p) => p.externalId);
    const existingProducts = await prisma.product.findMany({
      where: {
        storeId: { in: storeIds },
        externalId: { in: externalIds },
      },
      select: {
        storeId: true,
        externalId: true,
      },
    });

    const existingKeys = new Set(
      existingProducts.map((p) => `${p.storeId}-${p.externalId}`)
    );

    const productsToCreate = products.filter(
      (p) => !existingKeys.has(`${p.storeId}-${p.externalId}`)
    );

    if (productsToCreate.length === 0) {
      return {
        count: 0,
        message: "All products already exist, none created",
      };
    }

    // Create products that don't exist
    const created = await prisma.product.createMany({
      data: productsToCreate,
    });

    return {
      count: created.count,
      message: `Successfully created ${created.count} products`,
    };
  }

  // Bulk delete products
  async bulkDeleteProducts(userId: string, ids: string[]) {
    // Verify ownership of all products
    const products = await prisma.product.findMany({
      where: {
        id: { in: ids },
        store: { userId },
      },
    });

    if (products.length !== ids.length) {
      throw ApiError.unauthorized(
        "One or more products not found or unauthorized"
      );
    }

    // Delete all products
    const result = await prisma.product.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return {
      count: result.count,
      message: `Successfully deleted ${result.count} products`,
    };
  }
}

export const productsService = new ProductsService();
