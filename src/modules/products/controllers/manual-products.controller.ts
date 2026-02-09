import { NextFunction, Request, Response } from "express";
import { MESSAGES } from "../../../common/constants/messages.constant";
import {
  sendCreated,
  sendPaginated,
  sendSuccess,
} from "../../../common/utils/response.util";
import {
  BulkCsvImportBody,
  CreateManualProductBody,
  GetManualProductsQuery,
  UpdateManualProductBody,
} from "../products.validation";
import { manualProductsService } from "../services/manual-products.service";

export class ManualProductsController {
  // Get all uploaded products --- GET /products/manual
  async getManualProducts(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const query: GetManualProductsQuery = req.query as any;

      const result = await manualProductsService.getManualProducts(
        userId,
        query,
      );

      sendPaginated(res, MESSAGES.PRODUCTS.FETCHED, result);
    } catch (error) {
      next(error);
    }
  }

  // Get uploaded product by ID --- GET /products/manual/:id
  async getManualProductById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const product = await manualProductsService.getManualProductById(
        id,
        userId,
      );

      sendSuccess(res, MESSAGES.PRODUCTS.FETCHED_ONE, product);
    } catch (error) {
      next(error);
    }
  }

  // Create manual product --- POST /products/manual
  async createManualProduct(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: CreateManualProductBody = req.body;

      const product = await manualProductsService.createManualProduct(
        userId,
        data,
      );

      sendCreated(res, MESSAGES.PRODUCTS.CREATED, product);
    } catch (error) {
      next(error);
    }
  }

  // Create multiple manual products --- POST /products/manual/bulk
  async bulkCreateManualProducts(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: BulkCsvImportBody = req.body;

      const products = await manualProductsService.importProductsFromCsv(
        userId,
        data,
      );

      sendCreated(res, MESSAGES.PRODUCTS.CREATED, products);
    } catch (error) {
      next(error);
    }
  }

  // Update manual product --- PUT /products/manual/:id
  async updateManualProduct(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const data: UpdateManualProductBody = req.body;

      const product = await manualProductsService.updateManualProduct(
        id,
        userId,
        data,
      );

      sendSuccess(res, MESSAGES.PRODUCTS.UPDATED, product);
    } catch (error) {
      next(error);
    }
  }

  // Delete manual product --- DELETE /products/manual/:id
  async deleteManualProduct(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await manualProductsService.deleteManualProduct(id, userId);

      sendSuccess(res, MESSAGES.PRODUCTS.DELETED);
    } catch (error) {
      next(error);
    }
  }

  // Export manual products --- GET /products/manual/export
  async exportManualProducts(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const products = await manualProductsService.exportProductsToCsv(userId);

      sendSuccess(res, MESSAGES.PRODUCTS.FETCHED, products);
    } catch (error) {
      next(error);
    }
  }
}

export const manualProductsController = new ManualProductsController();
