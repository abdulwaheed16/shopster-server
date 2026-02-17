import { ApiError } from "../../../common/errors/api-error";
import { prisma } from "../../../config/database.config";
import { GetManualProductsQuery } from "../products.validation";

import { Prisma } from "@prisma/client";
import { calculatePagination } from "../../../common/utils/pagination.util";

export class UploadedProductsService {
  // Get all uploaded products for a user
  async getProducts(userId: string, query: GetManualProductsQuery) {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      userId,
      productSource: "UPLOADED",
    };

    if (query.isActive !== undefined) {
      where.isActive = query.isActive === "true";
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: calculatePagination(total, page, limit),
    };
  }

  // Get uploaded product by ID
  async getProductById(id: string, userId: string) {
    const product = await prisma.product.findFirst({
      where: {
        id,
        userId,
        productSource: "UPLOADED",
      },
    });

    if (!product) {
      throw ApiError.notFound("Product not found or you don't have access");
    }

    return product;
  }

  // Create uploaded product
  async createProduct(userId: string, data: any) {
    const images =
      data.images ||
      (data.imageUrl ? [{ url: data.imageUrl, position: 0 }] : []);

    return await prisma.product.create({
      data: {
        title: data.title,
        description: data.description,
        images: images as any,
        categoryIds: data.categoryIds || [],
        isActive: data.isActive,
        userId,
        productSource: "UPLOADED",
        externalId:
          data.externalId ||
          `uploaded-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      },
    });
  }

  // Bulk create uploaded products (e.g., from CSV)
  async bulkCreateProducts(userId: string, productsData: any[]) {
    const products = productsData?.map((p: any) => ({
      ...p,
      userId,
      productSource: "UPLOADED",
      images:
        p.images || (p.imageUrl ? [{ url: p.imageUrl, position: 0 }] : []),
      imageUrl: undefined,
      externalId:
        p.externalId ||
        `uploaded-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }));

    const result = await prisma.$transaction(
      products?.map((product: any) =>
        prisma.product.create({
          data: product,
        }),
      ),
    );

    return {
      count: result.length,
      message: `Successfully imported ${result.length} products`,
    };
  }

  // Update uploaded product
  async updateProduct(id: string, userId: string, data: any) {
    // Verify existence and ownership
    await this.getProductById(id, userId);

    const images =
      data.images ||
      (data.imageUrl ? [{ url: data.imageUrl, position: 0 }] : undefined);

    const { categoryId, category, ...otherData } = data;

    return await prisma.product.update({
      where: { id },
      data: {
        ...otherData,
        imageUrl: undefined,
        images: images as any,
        categoryIds: data.categoryIds,
      },
    });
  }

  // Delete uploaded product
  async deleteProduct(id: string, userId: string) {
    await this.getProductById(id, userId);

    await prisma.product.delete({
      where: { id },
    });
  }

  // Export products to CSV
  async exportProductsToCsv(userId: string) {
    const products = await prisma.product.findMany({
      where: { userId, productSource: "UPLOADED" },
      include: {
        categories: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return products.map((p: any) => ({
      title: p.title,
      description: p.description || "",
      imageUrl: p.images?.[0]?.url || "",
      categories: p.categories?.map((c: any) => c.name).join(", ") || "",
      isActive: p.isActive,
    }));
  }

  // Bulk delete uploaded products
  async bulkDeleteProducts(userId: string, ids: string[]) {
    const products = await prisma.product.findMany({
      where: {
        id: { in: ids },
        userId,
        productSource: "UPLOADED",
      },
      select: { id: true },
    });

    const validatedIds = products?.map((p) => p.id);

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

export const uploadedProductsService = new UploadedProductsService();
