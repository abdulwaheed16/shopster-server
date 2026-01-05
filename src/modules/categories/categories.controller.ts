import { NextFunction, Request, Response } from "express";
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
  // Get all categories --- GET /categories
  async getCategories(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const query: GetCategoriesQuery = req.query as any;

      const result = await categoriesService.getCategories(userId, query);

      sendPaginated(res, "Categories fetched successfully", result);
    } catch (error) {
      next(error);
    }
  }

  // Get category by ID --- GET /categories/:id
  async getCategoryById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const category = await categoriesService.getCategoryById(id, userId);

      sendSuccess(res, "Category fetched successfully", category);
    } catch (error) {
      next(error);
    }
  }

  // Create category --- POST /categories
  async createCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: CreateCategoryBody = req.body;

      const category = await categoriesService.createCategory(userId, data);

      sendCreated(res, "Category created successfully", category);
    } catch (error) {
      next(error);
    }
  }

  // Update category --- PUT /categories/:id
  async updateCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const data: UpdateCategoryBody = req.body;

      const category = await categoriesService.updateCategory(id, userId, data);

      sendSuccess(res, "Category updated successfully", category);
    } catch (error) {
      next(error);
    }
  }

  // Delete category --- DELETE /categories/:id
  async deleteCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await categoriesService.deleteCategory(id, userId);

      sendSuccess(res, "Category deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}

export const categoriesController = new CategoriesController();
