import { NextFunction, Request, Response } from "express";
import { MESSAGES } from "../../common/constants/messages.constant";
import { ApiError } from "../../common/errors/api-error";
import { sendSuccess } from "../../common/utils/response.util";
import { uploadService } from "./upload.service";

export class UploadController {
  /**
   * Upload single image
   * POST /upload/image
   */
  async uploadImage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;

      if (!req.file) {
        throw ApiError.badRequest("No image file provided");
      }

      const result = await uploadService.uploadImage(req.file, userId);

      sendSuccess(res, MESSAGES.STORAGE.UPLOAD_SUCCESS, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload multiple images
   * POST /upload/images
   */
  async uploadImages(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw ApiError.badRequest("No image files provided");
      }

      const results = await uploadService.uploadImages(req.files, userId);

      sendSuccess(res, `${results.length} images uploaded successfully`, {
        images: results,
        count: results.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete image
   * DELETE /upload/:publicId
   */
  async deleteImage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // publicId comes as URL parameter, decode it
      const publicId = decodeURIComponent(req.params.publicId);

      const result = await uploadService.deleteImage(publicId);

      sendSuccess(res, MESSAGES.STORAGE.DELETE_SUCCESS, result);
    } catch (error) {
      next(error);
    }
  }
}

export const uploadController = new UploadController();
