import { NextFunction, Request, Response } from "express";
import {
  sendCreated,
  sendPaginated,
  sendSuccess,
} from "../../common/utils/response.util";
import { productsService } from "./products.service";
import {
  CreateProductBody,
  GetProductsQuery,
  UpdateProductBody,
} from "./products.validation";

export class ProductsController {
  // Get all products --- GET /products
  async getProducts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const query: GetProductsQuery = req.query as any;

      const result = await productsService.getProducts(userId, query);

      sendPaginated(res, "Products fetched successfully", result);
    } catch (error) {
      next(error);
    }
  }

  // Get product by ID --- GET /products/:id
  async getProductById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const product = await productsService.getProductById(id, userId);

      sendSuccess(res, "Product fetched successfully", product);
    } catch (error) {
      next(error);
    }
  }

  // Create product --- POST /products
  async createProduct(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: CreateProductBody = req.body;

      const product = await productsService.createProduct(userId, data);

      sendCreated(res, "Product created successfully", product);
    } catch (error) {
      next(error);
    }
  }

  // Update product --- PUT /products/:id
  async updateProduct(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const data: UpdateProductBody = req.body;

      const product = await productsService.updateProduct(id, userId, data);

      sendSuccess(res, "Product updated successfully", product);
    } catch (error) {
      next(error);
    }
  }

  // Delete product --- DELETE /products/:id
  async deleteProduct(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await productsService.deleteProduct(id, userId);

      sendSuccess(res, "Product deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  // Bulk create products --- POST /products/bulk
  async bulkCreateProducts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const products: CreateProductBody[] = req.body.products;

      const result = await productsService.bulkCreateProducts(userId, products);

      sendCreated(res, result.message, { count: result.count });
    } catch (error) {
      next(error);
    }
  }

  // Bulk delete products --- POST /products/bulk-delete
  async bulkDeleteProducts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { ids } = req.body;

      const result = await productsService.bulkDeleteProducts(userId, ids);

      sendSuccess(res, `${result.count} products deleted successfully`, {
        count: result.count,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const productsController = new ProductsController();
