import { MESSAGES } from "../../../../common/constants/messages.constant";
import {
  cloudinary,
  cloudinaryOptions,
} from "../../../../config/cloudinary.config";
import {
  IStorageService,
  StorageUploadOptions,
  StorageUploadResult,
} from "../../interfaces/storage.interface";
import { STORAGE_PROVIDERS } from "../../upload.constants";

/**
 * CONCRETE STRATEGY: CloudinaryStorageService
 * Implements IStorageService using the existing Cloudinary setup.
 */
export class CloudinaryStorageService implements IStorageService {
  getProviderName(): string {
    return STORAGE_PROVIDERS.CLOUDINARY;
  }

  /**
   * Upload logic for Cloudinary.
   * Maps generic StorageUploadOptions to Cloudinary-specific UploadApiOptions.
   */
  async upload(
    file: string | Buffer,
    options?: StorageUploadOptions
  ): Promise<StorageUploadResult> {
    try {
      const uploadOptions = this.getUploadOptions(options);

      if (Buffer.isBuffer(file)) {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
              if (error) {
                reject(
                  new Error(
                    `${MESSAGES.STORAGE.UPLOAD_FAILED}: ${error.message}`
                  )
                );
              } else if (result) {
                resolve(this.mapUploadResult(result));
              }
            }
          );
          uploadStream.end(file);
        });
      }

      const result = await cloudinary.uploader.upload(
        file as string,
        uploadOptions
      );
      return this.mapUploadResult(result);
    } catch (error: any) {
      console.error(
        `[CloudinaryStorageService] ${MESSAGES.STORAGE.UPLOAD_FAILED}:`,
        error.message
      );
      throw new Error(`${MESSAGES.STORAGE.UPLOAD_FAILED}: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(id);
    } catch (error: any) {
      console.error(
        `[CloudinaryStorageService] ${MESSAGES.STORAGE.DELETE_FAILED}:`,
        error.message
      );
      throw new Error(`${MESSAGES.STORAGE.DELETE_FAILED}: ${error.message}`);
    }
  }

  /**
   * Helper to map consistent Cloudinary options
   */
  private getUploadOptions(options?: StorageUploadOptions) {
    return {
      folder: options?.folder || cloudinaryOptions.ads.folder,
      resource_type: options?.resourceType || "image",
      allowed_formats: (options?.allowedFormats || [
        ...cloudinaryOptions.ads.allowed_formats,
      ]) as any,
      transformation: options?.transformation || [
        ...cloudinaryOptions.ads.transformation,
      ],
      public_id: options?.publicId,
    };
  }

  /**
   * Helper to map Cloudinary result to generic StorageUploadResult
   */
  private mapUploadResult(result: any): StorageUploadResult {
    return {
      url: result.secure_url,
      id: result.public_id,
      metadata: {
        width: result.width,
        height: result.height,
        format: result.format,
      },
    };
  }
}

export const cloudinaryStorageService = new CloudinaryStorageService();
