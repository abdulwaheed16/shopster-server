import { NextFunction, Request, Response } from "express";
import { MESSAGES } from "../../../common/constants/messages.constant";
import {
  sendCreated,
  sendPaginated,
  sendSuccess,
} from "../../../common/utils/response.util";
import {
  CreateProductBody,
  GetProductsQuery,
  UpdateProductBody,
} from "../products.validation";
import { storeProductsService } from "../services/store-products.service";

export class StoreProductsController {
  // Get all products --- GET /products/store
  async getProducts(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const query: GetProductsQuery = req.query as any;

      const result = await storeProductsService.getProducts(userId, query);

      sendPaginated(res, MESSAGES.PRODUCTS.FETCHED, result);
    } catch (error) {
      next(error);
    }
  }

  // Get product by ID --- GET /products/store/:id
  async getProductById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const product = await storeProductsService.getProductById(id, userId);

      sendSuccess(res, MESSAGES.PRODUCTS.FETCHED_ONE, product);
    } catch (error) {
      next(error);
    }
  }

  // Create product --- POST /products/store
  async createProduct(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: CreateProductBody = req.body;

      const product = await storeProductsService.createProduct(userId, data);

      sendCreated(res, MESSAGES.PRODUCTS.CREATED, product);
    } catch (error) {
      next(error);
    }
  }

  // Update product --- PUT /products/store/:id
  async updateProduct(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const data: UpdateProductBody = req.body;

      const product = await storeProductsService.updateProduct(
        id,
        userId,
        data,
      );

      sendSuccess(res, MESSAGES.PRODUCTS.UPDATED, product);
    } catch (error) {
      next(error);
    }
  }

  // Delete product --- DELETE /products/store/:id
  async deleteProduct(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await storeProductsService.deleteProduct(id, userId);

      sendSuccess(res, MESSAGES.PRODUCTS.DELETED);
    } catch (error) {
      next(error);
    }
  }

  // Bulk create products --- POST /products/store/bulk
  async bulkCreateProducts(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const products: CreateProductBody[] = req.body.products;

      const result = await storeProductsService.bulkCreateProducts(
        userId,
        products,
      );

      sendCreated(res, result.message, { count: result.count });
    } catch (error) {
      next(error);
    }
  }

  // Bulk delete products --- POST /products/store/bulk-delete
  async bulkDeleteProducts(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { ids } = req.body;

      const result = await storeProductsService.bulkDeleteProducts(userId, ids);

      sendSuccess(res, `${result.count} products deleted successfully`, {
        count: result.count,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const storeProductsController = new StoreProductsController();
