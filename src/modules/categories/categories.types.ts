import { PaginatedResponse } from "../../common/utils/pagination.util";
import { Category } from "@prisma/client";
import {
  CreateCategoryBody,
  GetCategoriesQuery,
  UpdateCategoryBody,
} from "./categories.validation";

export interface ICategoriesService {
  getCategories(
    userId: string,
    query: GetCategoriesQuery
  ): Promise<PaginatedResponse<unknown>>;
  getCategoryById(id: string, userId: string): Promise<Category>;
  createCategory(userId: string, data: CreateCategoryBody): Promise<Category>;
  updateCategory(
    id: string,
    userId: string,
    data: UpdateCategoryBody
  ): Promise<Category>;
  deleteCategory(id: string, userId: string): Promise<void>;
}
