import { AspectRatio } from "../../ai/ai.constants";

export interface GenerateAdPayload {
  productId?: string;
  uploadedProductId?: string;
  productImageUrls?: string[];
  templateId?: string;
  templateImageUrl?: string;
  modelImageUrl?: string;
  productTitle?: string;
  title?: string;
  variableValues?: Record<string, any>;
  aspectRatio?: AspectRatio;
  variantsCount?: number;
  style?: string;
  color?: string;
  scenes?: string[];
  prompt?: string;
  duration?: number;
  mediaType?: "IMAGE" | "VIDEO";
}
