import { del, put } from "@vercel/blob";
import { MESSAGES } from "../../../../common/constants/messages.constant";
import { config } from "../../../../config/env.config";
import {
  IStorageService,
  StorageUploadOptions,
  StorageUploadResult,
} from "../../interfaces/storage.interface";
import { STORAGE_PROVIDERS } from "../../upload.constants";

/**
 * CONCRETE STRATEGY: VercelBlobService
 * Implements IStorageService using @vercel/blob.
 * Now fully integrated with BLOB_READ_WRITE_TOKEN.
 */
export class VercelBlobService implements IStorageService {
  private readonly token: string;

  constructor() {
    this.token = config.storage.blobToken || "";
  }

  getProviderName(): string {
    return STORAGE_PROVIDERS.VERCEL_BLOB;
  }

  /**
   * Upload logic for Vercel Blob.
   * Handles both Buffer and string (URL/path) inputs.
   */
  async upload(
    file: string | Buffer,
    options?: StorageUploadOptions
  ): Promise<StorageUploadResult> {
    if (!this.token) {
      throw new Error(MESSAGES.STORAGE.NOT_CONNECTED);
    }

    try {
      // For Vercel Blob, the publicId is treated as the path/filename
      const filename = options?.publicId || `upload_${Date.now()}`;
      const pathname = options?.folder
        ? `${options.folder}/${filename}`
        : filename;

      const blob = await put(pathname, file, {
        access: "public",
        token: this.token,
        contentType:
          options?.resourceType === "image" ? "image/webp" : undefined,
      });

      return {
        url: blob.url,
        id: blob.url, // Vercel Blob uses the URL as the identifier for deletion
        metadata: {
          pathname: blob.pathname,
          contentType: blob.contentType,
        },
      };
    } catch (error: any) {
      console.error(
        `[VercelBlobService] ${MESSAGES.STORAGE.UPLOAD_FAILED}:`,
        error.message
      );
      throw new Error(`${MESSAGES.STORAGE.UPLOAD_FAILED}: ${error.message}`);
    }
  }

  /**
   * Deletion via Vercel Blob.
   * @param id - The blob URL or pathname.
   */
  async delete(id: string): Promise<void> {
    if (!this.token) {
      throw new Error(MESSAGES.STORAGE.NOT_CONNECTED);
    }

    try {
      await del(id, { token: this.token });
    } catch (error: any) {
      console.error(
        `[VercelBlobService] ${MESSAGES.STORAGE.DELETE_FAILED}:`,
        error.message
      );
      throw new Error(`${MESSAGES.STORAGE.DELETE_FAILED}: ${error.message}`);
    }
  }
}

export const vercelBlobService = new VercelBlobService();
