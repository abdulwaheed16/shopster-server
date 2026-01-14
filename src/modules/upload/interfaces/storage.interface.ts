/**
 * SOLID: Interface Segregation & Dependency Inversion
 * This interface defines the contract for storage operations.
 * By depending on this interface, the AdProcessorService remains agnostic
 * of whether we use Cloudinary, Vercel Blob, or S3.
 */

export interface StorageUploadOptions {
  folder?: string;
  publicId?: string;
  resourceType?: "image" | "video" | "raw";
  allowedFormats?: string[];
  transformation?: any[];
}

export interface StorageUploadResult {
  url: string;
  id: string; // The provider-specific ID (e.g., Cloudinary public_id or Vercel Blob path)
  metadata?: Record<string, any>;
}

export interface IStorageService {
  /**
   * Uploads a file (URL, Buffer, or File path) to the storage provider.
   */
  upload(
    file: string | Buffer,
    options?: StorageUploadOptions
  ): Promise<StorageUploadResult>;

  /**
   * Deletes a file from the storage provider by its ID.
   */
  delete(id: string): Promise<void>;

  /**
   * Returns the provider identifier (e.g., 'cloudinary', 'vercel-blob').
   */
  getProviderName(): string;
}
