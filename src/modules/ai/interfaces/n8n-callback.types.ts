export interface N8NCallbackPayload {
  adId: string;
  status: "COMPLETED" | "SUCCESS" | "FAILED" | "ERROR";
  mediaType?: "IMAGE" | "VIDEO";
  imageUrls?: string[];
  videoUrls?: string[];
  error?: string;
}
