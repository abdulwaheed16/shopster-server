import { MESSAGES } from "../../common/constants/messages.constant";
import { cloudinaryStorageService } from "./services/storage/cloudinary-storage.service";
import { IUploadService } from "./upload.types";

/**
 * UploadService
 * Refactored to use the unified IStorageService (SOLID: Single Responsibility).
 * It now acts as a bridge between Multer-based uploads and our storage layer.
 */
export class UploadService implements IUploadService {
  /**
   * Upload single image to Cloudinary
   * @param file - Multer file object (in memory)
   * @param userId - User ID for folder organization
   */
  async uploadImage(
    file: Express.Multer.File,
    userId: string
  ): Promise<{
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
  }> {
    try {
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
    } catch (error: any) {
      console.error(
        `[UploadService] ${MESSAGES.STORAGE.UPLOAD_FAILED}:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Upload multiple images to Cloudinary
   * @param files - Array of Multer file objects
   * @param userId - User ID for folder organization
   */
  async uploadImages(
    files: Express.Multer.File[],
    userId: string
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
   * Delete image from Cloudinary
   * @param publicId - Cloudinary public ID
   */
  async deleteImage(publicId: string): Promise<{ result: string }> {
    try {
      await cloudinaryStorageService.delete(publicId);
      return { result: MESSAGES.GENERAL.OK };
    } catch (error: any) {
      console.error(
        `[UploadService] ${MESSAGES.STORAGE.DELETE_FAILED}:`,
        error.message
      );
      throw error;
    }
  }
}

export const uploadService = new UploadService();
