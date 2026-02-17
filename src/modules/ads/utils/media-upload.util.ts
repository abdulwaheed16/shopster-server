import { MediaType } from "@prisma/client";
import axios from "axios";
import { IStorageService } from "../../upload/interfaces/storage.interface";

/**
 * UTILITY: Media Upload Helper
 *
 * This utility function downloads media from a URL and uploads it to storage.
 * Currently commented out as we're using n8n URLs directly, but kept for future use
 * if you need to re-upload media to your own storage (Cloudinary, etc.)
 */

interface UploadResult {
  url: string;
  id: string;
  metadata?: Record<string, any>;
}

/**
 * Downloads and uploads media variants to storage
 * @param mediaUrls - Array of media URLs to process
 * @param adId - The ad ID for folder organization
 * @param mediaType - Type of media (IMAGE or VIDEO)
 * @param storageService - Storage service instance
 * @returns Array of upload results
 */
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

/**
 * Downloads media from URL to buffer
 * @param url - Media URL to download
 * @returns Buffer containing the media data
 */
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
