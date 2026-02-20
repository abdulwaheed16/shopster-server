import { MediaType } from "@prisma/client";
import axios from "axios";
import { IStorageService } from "../../upload/interfaces/storage.interface";

interface UploadResult {
  url: string;
  id: string;
  metadata?: Record<string, any>;
}

export async function downloadAndUploadMedia(
  mediaUrls: string[],
  adId: string,
  mediaType: MediaType,
  storageService: IStorageService,
): Promise<UploadResult[]> {
  const uploadResults = await Promise.all(
    mediaUrls.map(async (url, index) => {
      try {
        // 1. Download to buffer
        const buffer = await downloadMediaToBuffer(url);

        // 2. Upload to storage
        const isVideo = mediaType === MediaType.VIDEO;
        const uploadResult = await storageService.upload(buffer, {
          publicId: `ad_${adId}_v${index}_${Date.now()}`,
          folder: `ads/${adId}`,
          resourceType: isVideo ? "video" : "image",
        });

        return uploadResult;
      } catch (uploadError: any) {
        console.error(
          `[MediaUploadUtil] Variant ${index} failed:`,
          uploadError.message,
        );
        return null;
      }
    }),
  );

  // Filter out failed uploads
  return uploadResults.filter((res): res is UploadResult => res !== null);
}

async function downloadMediaToBuffer(url: string): Promise<Buffer> {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(response.data);
  } catch (error: any) {
    console.error(
      `[MediaUploadUtil] Failed to download from ${url}:`,
      error.message,
    );
    throw new Error(`Failed to download media: ${error.message}`);
  }
}
