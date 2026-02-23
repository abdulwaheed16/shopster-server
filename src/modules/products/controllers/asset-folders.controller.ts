import { NextFunction, Request, Response } from "express";
import { sendCreated, sendSuccess } from "../../../common/utils/response.util";
import { assetFoldersService } from "../services/asset-folders.service";

export class AssetFoldersController {
  async createFolder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const folder = await assetFoldersService.createFolder(userId, req.body);
      sendCreated(res, "Folder created successfully", folder);
    } catch (error) {
      next(error);
    }
  }

  async getFolderTree(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const folders = await assetFoldersService.getFolderTree(userId);
      sendSuccess(res, "Folders fetched successfully", folders);
    } catch (error) {
      next(error);
    }
  }

  async renameFolder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { name } = req.body;
      const folder = await assetFoldersService.renameFolder(userId, id, name);
      sendSuccess(res, "Folder renamed successfully", folder);
    } catch (error) {
      next(error);
    }
  }

  async deleteFolder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { mode } = req.query as { mode: "relocate" | "recursive" };
      await assetFoldersService.deleteFolder(userId, id, mode);
      sendSuccess(res, "Folder deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  async moveProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { productIds, folderId } = req.body;
      await assetFoldersService.moveProducts(userId, productIds, folderId);
      sendSuccess(res, "Products moved successfully");
    } catch (error) {
      next(error);
    }
  }

  async moveFolder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { parentId } = req.body;
      await assetFoldersService.moveFolder(userId, id, parentId);
      sendSuccess(res, "Folder moved successfully");
    } catch (error) {
      next(error);
    }
  }
}

export const assetFoldersController = new AssetFoldersController();
