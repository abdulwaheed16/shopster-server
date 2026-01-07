import { v2 as cloudinary } from "cloudinary";
import { config } from "../../config/env.config";

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

import { IUploadService } from "./upload.types";

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
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `shopster/${userId}`,
          resource_type: "image",
          transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              format: result.format,
            });
          }
        }
      );

      // Send buffer to Cloudinary
      uploadStream.end(file.buffer);
    });
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
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  }
}

export const uploadService = new UploadService();
