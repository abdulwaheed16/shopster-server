import { NextFunction, Request, Response } from "express";
import { MESSAGES } from "../../../common/constants/messages.constant";
import { ApiError } from "../../../common/errors/api-error";
import {
  sendCreated,
  sendPaginated,
  sendSuccess,
} from "../../../common/utils/response.util";
import { GetProductsQuery } from "../products.validation";
import { storeProductsService } from "../services/store-products.service";
import { uploadedProductsService } from "../services/uploaded-products.service";

export class ProductsController {
  private getService(reqOrSource: Request | string | undefined | null) {
    if (!reqOrSource) return uploadedProductsService;

    const source =
      typeof reqOrSource === "string"
        ? reqOrSource
        : (reqOrSource as Request).query?.source ||
          (reqOrSource as Request).body?.productSource ||
          "ALL";

    return source === "UPLOADED" ? uploadedProductsService : storeProductsService;
  }

  // Get all products --- GET /products
  async getProducts(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const query: GetProductsQuery = req.query as any;

      const service = this.getService(req);
      const result = await service.getProducts(userId, query);

      sendPaginated(res, MESSAGES.PRODUCTS.FETCHED, result);
    } catch (error) {
      next(error);
    }
  }

  // Get product by ID --- GET /products/:id
  async getProductById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const service = this.getService(req);
      const product = await service.getProductById(id, userId);

      sendSuccess(res, MESSAGES.PRODUCTS.FETCHED_ONE, product);
    } catch (error) {
      next(error);
    }
  }

  // Create product --- POST /products
  async createProduct(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { productSource } = req.body;
      const data = req.body;

      const service = this.getService(productSource);
      const product = await service.createProduct(userId, data);

      sendCreated(res, MESSAGES.PRODUCTS.CREATED, product);
    } catch (error) {
      next(error);
    }
  }

  // Update product --- PATCH /products/:id
  async updateProduct(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id: productId } = req.params;
      const data = req.body;

      const service = this.getService(req);
      const product = await service.updateProduct(productId, userId, data);

      sendSuccess(res, MESSAGES.PRODUCTS.UPDATED, product);
    } catch (error) {
      next(error);
    }
  }

  // Delete product --- DELETE /products/:id
  async deleteProduct(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id: productId } = req.params;

      const service = this.getService(req);
      await service.deleteProduct(productId, userId);

      sendSuccess(res, MESSAGES.PRODUCTS.DELETED);
    } catch (error) {
      next(error);
    }
  }

  // Bulk create products --- POST /products/bulk
  async bulkCreateProducts(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { products } = req.body;
      const source = (req.query.source as string) ?? "UPLOADED";

      const service = this.getService(req);
      const result = await service.bulkCreateProducts(userId, products);

      sendCreated(res, result.message, { count: result.count });
    } catch (error) {
      next(error);
    }
  }

  // Bulk delete products --- POST /products/bulk-delete
  async bulkDeleteProducts(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { ids: productIds } = req.body;

      const service = this.getService(req);
      const result = await service.bulkDeleteProducts(userId, productIds);

      sendSuccess(res, result.message, {
        count: result.count,
      });
    } catch (error) {
      next(error);
    }
  }

  // Export products --- GET /products/export
  async exportProducts(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { source } = req.query;

      if (source === "UPLOADED") {
        const result =
          await uploadedProductsService.exportProductsToCsv(userId);
        sendSuccess(res, MESSAGES.PRODUCTS.FETCHED, result);
      } else {
        // Implement store product export if needed, otherwise throw error
        throw ApiError.badRequest(
          "Export only supported for uploaded products",
        );
      }
    } catch (error) {
      next(error);
    }
  }
}

export const productsController = new ProductsController();
