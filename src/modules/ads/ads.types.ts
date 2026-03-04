import { Ad, AdStatus } from "@prisma/client";
import { PaginatedResponse } from "../../common/utils/pagination.util";
import { GenerateAdBody, GetAdsQuery } from "./ads.validation";

// ─────────────────────────────────────────────────────────────────────────────
// Video Ad Generation DTOs
// ─────────────────────────────────────────────────────────────────────────────

export interface GenerateVideoBaseImageDto {
  adId?: string;
  categoryId: string;
  categoryName?: string;
  adType: string;
  products: Array<{
    productId: string;
    source: "STORE" | "UPLOADED";
    imageUrl: string;
  }>;
  modelImage: string;
  templateId?: string;
  templateImage?: string;
  productDescription?: string;
}

export interface GenerateVideoScenesDto {
  adId: string;
  baseImage: string;
  storyboard: string;
  productDescription: string;
  templateId?: string;
  duration?: number;
  categoryId?: string;
  categoryName?: string;
  adType?: string;
}

export interface GenerateVideoFoodScenesDto {
  categoryId: string;
  category: string;
  products: Array<{
    productId: string;
    source: "STORE" | "UPLOADED";
    imageUrl: string;
  }>;
  templateId?: string;
}

export interface RegenerateSceneDto {
  sceneId: string;
  description: string;
}

export interface GenerateFinalVideoDto {
  adId: string;
  adType: string;
  scenes: Array<{
    order: number;
    image: string;
    description: string;
  }>;
  duration?: number;
  aspectRatio?: string;
}

export interface GenerateVideoModelImageDto {
  adId?: string;
  gender: string;
  age: string;
  skin: string;
  notes?: string;
}

export interface IAdsService {
  getAds(
    userId: string,
    query: GetAdsQuery,
    userRole: string,
  ): Promise<PaginatedResponse<Ad>>;
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

  // Video Step-by-Step Methods
  generateVideoBaseImage(
    userId: string,
    data: GenerateVideoBaseImageDto,
  ): Promise<{ adId: string; status: string }>;
  generateVideoScenes(
    userId: string,
    data: GenerateVideoScenesDto,
  ): Promise<{ adId: string; status: string }>;
  generateVideoFoodScenes(
    userId: string,
    data: GenerateVideoFoodScenesDto,
  ): Promise<{ adId: string; status: string }>;
  regenerateScene(
    userId: string,
    adId: string,
    data: RegenerateSceneDto,
  ): Promise<{ adId: string; status: string; sceneId: string }>;
  regenerateAllScenes(
    userId: string,
    adId: string,
  ): Promise<{ adId: string; status: string }>;
  generateFinalVideo(
    userId: string,
    data: GenerateFinalVideoDto,
  ): Promise<{ adId: string; status: string }>;
  generateVideoModelImage(
    userId: string,
    data: GenerateVideoModelImageDto,
  ): Promise<{ adId: string; status: string }>;
}
