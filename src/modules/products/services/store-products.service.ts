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

    // 1. Define base filters for Store Products
    const storeProductsWhere: Prisma.ProductWhereInput = {
      store: { userId },
    };

    if (query.storeId) {
      storeProductsWhere.storeId = query.storeId;
    }

    if (query.categoryId) {
      storeProductsWhere.categoryId = query.categoryId;
    }

    if (query.isActive !== undefined) {
      storeProductsWhere.isActive = query.isActive === "true";
    }

    if (query.inStock !== undefined) {
      storeProductsWhere.inStock = query.inStock === "true";
    }

    if (query.search) {
      storeProductsWhere.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { sku: { contains: query.search, mode: "insensitive" } },
      ];
    }

    // 2. Define base filters for Uploaded Products
    const uploadedProductsWhere: Prisma.UploadedProductWhereInput = {
      userId,
    };

    if (query.categoryId) {
      uploadedProductsWhere.categoryId = query.categoryId;
    }

    if (query.isActive !== undefined) {
      uploadedProductsWhere.isActive = query.isActive === "true";
    }

    if (query.search) {
      uploadedProductsWhere.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    let products: any[] = [];
    let total = 0;

    if (source === "STORE") {
      [products, total] = await Promise.all([
        prisma.product.findMany({
          where: storeProductsWhere,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            store: { select: { name: true } },
            category: { select: { name: true } },
          },
        }),
        prisma.product.count({ where: storeProductsWhere }),
      ]);
    } else if (source === "UPLOADED") {
      const [rawUploadedProducts, rawTotal] = await Promise.all([
        prisma.uploadedProduct.findMany({
          where: uploadedProductsWhere,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            category: { select: { name: true } },
          },
        }),
        prisma.uploadedProduct.count({ where: uploadedProductsWhere }),
      ]);

      products = rawUploadedProducts.map((p) => ({
        ...p,
        productSource: "UPLOADED",
        images: p.imageUrl
          ? [{ url: p.imageUrl, alt: p.title, position: 0 }]
          : [],
        variants: [],
        store: { name: "Manual Upload" },
      }));
      total = rawTotal;
    } else {
      // source === "ALL" - For simplicity, combine with priority to Store products
      // In a real scenario, we might want a unified view or more complex pagination
      const [storeProds, storeTotal, uploadedProds, uploadedTotal] =
        await Promise.all([
          prisma.product.findMany({
            where: storeProductsWhere,
            orderBy: { createdAt: "desc" },
            include: {
              store: { select: { name: true } },
              category: { select: { name: true } },
            },
          }),
          prisma.product.count({ where: storeProductsWhere }),
          prisma.uploadedProduct.findMany({
            where: uploadedProductsWhere,
            orderBy: { createdAt: "desc" },
            include: {
              category: { select: { name: true } },
            },
          }),
          prisma.uploadedProduct.count({ where: uploadedProductsWhere }),
        ]);

      const mappedUploaded = uploadedProds.map((p) => ({
        ...p,
        productSource: "UPLOADED",
        images: p.imageUrl
          ? [{ url: p.imageUrl, alt: p.title, position: 0 }]
          : [],
        variants: [],
        store: { name: "Manual Upload" },
      }));

      const allProds = [...storeProds, ...mappedUploaded].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );

      total = storeTotal + uploadedTotal;
      products = allProds.slice(skip, skip + limit);
    }

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

    // 2. Prepare data
    const productData = {
      ...data,
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

    const count = await prisma.$transaction(async (tx) => {
      let created = 0;
      for (const p of productsData) {
        await tx.product.upsert({
          where: {
            storeId_externalId: {
              storeId: p.storeId,
              externalId: p.externalId as string,
            },
          },
          update: {
            ...p,
            externalId:
              p.externalId ||
              `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            images: p.images as any,
            variants: p.variants as any,
          },
          create: {
            ...p,
            externalId:
              p.externalId ||
              `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

export const storeProductsService = new StoreProductsService();
