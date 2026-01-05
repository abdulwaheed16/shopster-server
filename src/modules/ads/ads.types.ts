import { PaginatedResponse } from "../../common/utils/pagination.util";
import { Ad } from "@prisma/client";
import { GenerateAdBody, GetAdsQuery } from "./ads.validation";

export interface IAdsService {
  getAds(userId: string, query: GetAdsQuery): Promise<PaginatedResponse<unknown>>;
  getAdById(id: string, userId: string): Promise<Ad>;
  generateAd(userId: string, data: GenerateAdBody): Promise<Ad>;
  deleteAd(id: string, userId: string): Promise<void>;
  bulkDeleteAds(
    userId: string,
    ids: string[]
  ): Promise<{ count: number; message: string }>;
}
