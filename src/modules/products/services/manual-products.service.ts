import { ApiError } from "../../../common/errors/api-error";
import { prisma } from "../../../config/database.config";
import {
  BulkCsvImportBody,
  CreateManualProductBody,
  GetManualProductsQuery,
  UpdateManualProductBody,
} from "../products.validation";

import { Prisma } from "@prisma/client";
import { calculatePagination } from "../../../common/utils/pagination.util";

export class ManualProductsService {
  // Get all uploaded products for a user
  async getManualProducts(userId: string, query: GetManualProductsQuery) {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const skip = (page - 1) * limit;

    const where: Prisma.UploadedProductWhereInput = {
      userId,
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
      prisma.uploadedProduct.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.uploadedProduct.count({ where }),
    ]);

    return {
      data: products,
      meta: calculatePagination(total, page, limit),
    };
  }

  // Get uploaded product by ID
  async getManualProductById(id: string, userId: string) {
    const product = await prisma.uploadedProduct.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!product) {
      throw ApiError.notFound("Product not found or you don't have access");
    }

    return product;
  }

  // Create manual product
  async createManualProduct(userId: string, data: CreateManualProductBody) {
    return await prisma.uploadedProduct.create({
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl ?? undefined,
        categoryId: data.categoryId,
        isActive: data.isActive,
        userId,
      },
    });
  }

  // Import products from CSV (Bulk)
  async importProductsFromCsv(userId: string, data: BulkCsvImportBody) {
    const products = data.products.map((p: any) => ({
      ...p,
      userId,
    }));

    return await prisma.$transaction(
      products.map((product: any) =>
        prisma.uploadedProduct.create({
          data: product,
        }),
      ),
    );
  }

  // Update manual product
  async updateManualProduct(
    id: string,
    userId: string,
    data: UpdateManualProductBody,
  ) {
    // Verify existence and ownership
    await this.getManualProductById(id, userId);

    return await prisma.uploadedProduct.update({
      where: { id },
      data,
    });
  }

  // Delete manual product
  async deleteManualProduct(id: string, userId: string) {
    await this.getManualProductById(id, userId);

    await prisma.uploadedProduct.delete({
      where: { id },
    });
  }

  // Export products to CSV
  async exportProductsToCsv(userId: string) {
    const products = await prisma.uploadedProduct.findMany({
      where: { userId },
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return products.map((p) => ({
      title: p.title,
      description: p.description || "",
      imageUrl: p.imageUrl || "",
      category: p.category?.name || "",
      isActive: p.isActive,
    }));
  }
}

export const manualProductsService = new ManualProductsService();
