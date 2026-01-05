import { Store } from "@prisma/client";
import { PaginatedResponse } from "../../common/utils/pagination.util";
import {
  CreateStoreBody,
  GetStoresQuery,
  UpdateStoreBody,
} from "./stores.validation";

export interface IStoresService {
  getStores(
    userId: string,
    query: GetStoresQuery
  ): Promise<PaginatedResponse<unknown>>;
  getStoreById(id: string, userId: string): Promise<Store>;
  createStore(userId: string, data: CreateStoreBody): Promise<Store>;
  updateStore(
    id: string,
    userId: string,
    data: UpdateStoreBody
  ): Promise<Store>;
  deleteStore(id: string, userId: string): Promise<void>;
  upsertStoreByShopifyDomain(
    userId: string,
    data: {
      name: string;
      storeUrl: string;
      shopifyDomain: string;
      accessToken: string;
    }
  ): Promise<Store>;
  syncStore(id: string, userId: string): Promise<{ message: string }>;
}

export interface IShopifyService {
  generateAuthUrl(shop: string, state: string): string;
  verifyHmac(query: Record<string, unknown>): boolean;
  exchangeCodeForToken(shop: string, code: string): Promise<string>;
  fetchProducts(
    shop: string,
    accessToken: string,
    limit?: number
  ): Promise<unknown[]>;
  registerWebhooks(shop: string, accessToken: string): Promise<void>;
  verifyWebhookHmac(rawBody: string, hmacHeader: string): boolean;
}
