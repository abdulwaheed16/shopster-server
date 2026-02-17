import { AspectRatio } from "../../ai/ai.constants";

export interface GenerateAdPayload {
  productId?: string;
  uploadedProductId?: string;
  productImageUrls?: string | string[]; // Matches z.union([z.string(), z.array(z.string())])
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
  videoType?:
    | "STATIC"
    | "PAN_AND_TILT"
    | "PUSH_IN_PULL_OUT"
    | "BOOM_AND_CRANE"
    | "TRACKING_AND_TRUCKING"
    | "ARC_SHOT";
  thoughts?: string;
  duration?: number;
  mediaType?: "IMAGE" | "VIDEO";
}
