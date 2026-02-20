import { NextFunction, Request, Response } from "express";
import { MESSAGES } from "../../common/constants/messages.constant";
import { ApiError } from "../../common/errors/api-error";
import { sendSuccess } from "../../common/utils/response.util";
import { uploadService } from "./upload.service";

export class UploadController {
  async uploadImage(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const type = req.body.type || req.query.type;

      if (!req.file) {
        throw ApiError.badRequest("No image file provided");
      }

      const result = await uploadService.uploadImage(req.file, userId, type);

      sendSuccess(res, MESSAGES.STORAGE.UPLOAD_SUCCESS, result);
    } catch (error) {
      next(error);
    }
  }

  async uploadImages(
    req: Request,
    res: Response,
    next: NextFunction,
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

  async uploadVideo(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const type = req.body.type || req.query.type;

      if (!req.file) {
        throw ApiError.badRequest("No video file provided");
      }

      const result = await uploadService.uploadVideo(req.file, userId, type);

      sendSuccess(res, MESSAGES.STORAGE.UPLOAD_SUCCESS, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteImage(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // publicId comes as URL parameter, decode it
      const publicId = decodeURIComponent(req.params.publicId as string);

      const result = await uploadService.deleteImage(publicId);

      sendSuccess(res, MESSAGES.STORAGE.DELETE_SUCCESS, result);
    } catch (error) {
      next(error);
    }
  }
}

export const uploadController = new UploadController();
