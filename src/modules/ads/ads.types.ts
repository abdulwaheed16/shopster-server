import { Ad, AdStatus } from "@prisma/client";
import { PaginatedResponse } from "../../common/utils/pagination.util";
import { GenerateAdBody, GetAdsQuery } from "./ads.validation";

export interface IAdsService {
  getAds(
    userId: string,
    query: GetAdsQuery,
  ): Promise<PaginatedResponse<unknown>>;
  getAdById(id: string, userId: string): Promise<Ad>;
  generateAd(userId: string, data: GenerateAdBody): Promise<Ad>;
  updateAd(
    id: string,
    userId: string,
    data: Partial<{ title: string; status: AdStatus; variableValues: any }>,
  ): Promise<Ad>;
  deleteAd(id: string, userId: string): Promise<void>;
  bulkDeleteAds(
    userId: string,
    ids: string[],
  ): Promise<{ count: number; message: string }>;
  cancelAd(adId: string, userId: string): Promise<void>;
  subscribeToAdUpdates(adId: string, callback: (data: any) => void): () => void;
  emitAdUpdate(
    adId: string,
    status: AdStatus,
    data?: Record<string, any>,
  ): void;
}
