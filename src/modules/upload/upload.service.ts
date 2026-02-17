import { MESSAGES } from "../../common/constants/messages.constant";
import { vercelBlobService } from "./services/storage/vercel-blob.service";
import { IUploadService } from "./upload.types";

/**
 * UploadService
 * Refactored to use the unified IStorageService (SOLID: Single Responsibility).
 * It now acts as a bridge between Multer-based uploads and our storage layer.
 */
export class UploadService implements IUploadService {
  /**
   * Upload single image
   * @param file - Multer file object (in memory)
   * @param userId - User ID for folder organization
   * @param type - Optional type hint ('avatar' uses Vercel Blob, others Cloudinary)
   */
  async uploadImage(
    file: Express.Multer.File,
    userId: string,
    type?: string,
  ): Promise<{
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
  }> {
    try {
      // Use Vercel Blob for all uploads (Cloudinary is disconnected but code is preserved)
      const result = await vercelBlobService.upload(file.buffer, {
        folder: type === "avatar" ? `avatars/${userId}` : `assets/${userId}`,
        publicId: `${type || "asset"}_${Date.now()}`,
        resourceType: "image",
      });

      console.log("Image Upload Result: ", result);

      return {
        url: result.url,
        publicId: result.id,
        width: 0,
        height: 0,
        format: "webp",
      };

      /* 
      // Cloudinary Logic (Disconnected)
      const result = await cloudinaryStorageService.upload(file.buffer, {
        folder: `shopster/${userId}`,
      });

      return {
        url: result.url,
        publicId: result.id,
        width: result.metadata?.width || 0,
        height: result.metadata?.height || 0,
        format: result.metadata?.format || "",
      };
      */
    } catch (error: any) {
      console.error(
        `[UploadService] ${MESSAGES.STORAGE.UPLOAD_FAILED}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Upload single video
   * @param file - Multer file object
   * @param userId - User ID
   * @param type - Optional type hint
   */
  async uploadVideo(
    file: Express.Multer.File,
    userId: string,
    type?: string,
  ): Promise<{
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
  }> {
    try {
      const result = await vercelBlobService.upload(file.buffer, {
        folder: `videos/${userId}`,
        publicId: `${type || "video"}_${Date.now()}`,
        resourceType: "video",
      });

      return {
        url: result.url,
        publicId: result.id,
        width: 0,
        height: 0,
        format: "mp4", // Default or extract from file
      };
    } catch (error: any) {
      console.error(
        `[UploadService] ${MESSAGES.STORAGE.UPLOAD_FAILED}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Upload multiple images
   * @param files - Array of Multer file objects
   * @param userId - User ID for folder organization
   */
  async uploadImages(
    files: Express.Multer.File[],
    userId: string,
  ): Promise<
    Array<{
      url: string;
      publicId: string;
      width: number;
      height: number;
      format: string;
    }>
  > {
    const uploadPromises = files?.map((file) => this.uploadImage(file, userId));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete image
   * @param publicId - Public ID / URL
   */
  async deleteImage(publicId: string): Promise<{ result: string }> {
    try {
      // Try deleting from Vercel Blob first (provider agnostic for now)
      if (publicId.includes("public.blob.vercel-storage.com")) {
        await vercelBlobService.delete(publicId);
      } else {
        // Fallback for Cloudinary if it's a legacy publicId
        // await cloudinaryStorageService.delete(publicId);
      }
      return { result: MESSAGES.GENERAL.OK };
    } catch (error: any) {
      console.error(
        `[UploadService] ${MESSAGES.STORAGE.DELETE_FAILED}:`,
        error.message,
      );
      throw error;
    }
  }
}

export const uploadService = new UploadService();
