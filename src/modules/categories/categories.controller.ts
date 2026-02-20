import { NextFunction, Request, Response } from "express";
import { MESSAGES } from "../../common/constants/messages.constant";
import {
  sendCreated,
  sendPaginated,
  sendSuccess,
} from "../../common/utils/response.util";
import { categoriesService } from "./categories.service";
import {
  CreateCategoryBody,
  GetCategoriesQuery,
  UpdateCategoryBody,
} from "./categories.validation";

export class CategoriesController {
  async getCategories(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const query: GetCategoriesQuery = req.query as any;

      const result = await categoriesService.getCategories(userId, query);

      sendPaginated(res, MESSAGES.CATEGORIES.FETCHED, result);
    } catch (error) {
      next(error);
    }
  }

  async getCategoryById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const category = await categoriesService.getCategoryById(
        id as string,
        userId,
      );

      sendSuccess(res, MESSAGES.CATEGORIES.FETCHED_ONE, category);
    } catch (error) {
      next(error);
    }
  }

  async createCategory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: CreateCategoryBody = req.body;

      const category = await categoriesService.createCategory(userId, data);

      sendCreated(res, MESSAGES.CATEGORIES.CREATED, category);
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const data: UpdateCategoryBody = req.body;

      const category = await categoriesService.updateCategory(
        id as string,
        userId,
        data,
      );

      sendSuccess(res, MESSAGES.CATEGORIES.UPDATED, category);
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await categoriesService.deleteCategory(id as string, userId);

      sendSuccess(res, MESSAGES.CATEGORIES.DELETED);
    } catch (error) {
      next(error);
    }
  }
}

export const categoriesController = new CategoriesController();
