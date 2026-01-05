import { Product } from "@prisma/client";
import { PaginatedResponse } from "../../common/utils/pagination.util";
import {
  CreateProductBody,
  GetProductsQuery,
  UpdateProductBody,
} from "./products.validation";

export interface IProductsService {
  getProducts(
    userId: string,
    query: GetProductsQuery
  ): Promise<PaginatedResponse<unknown>>;
  getProductById(id: string, userId: string): Promise<Product>;
  createProduct(userId: string, data: CreateProductBody): Promise<Product>;
  updateProduct(
    id: string,
    userId: string,
    data: UpdateProductBody
  ): Promise<Product>;
  deleteProduct(id: string, userId: string): Promise<void>;
  bulkCreateProducts(
    userId: string,
    products: CreateProductBody[]
  ): Promise<{ count: number; message: string }>;
  bulkDeleteProducts(
    userId: string,
    ids: string[]
  ): Promise<{ count: number; message: string }>;
}
