import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { assetFoldersController } from "./controllers/asset-folders.controller";
import {
  createFolderSchema,
  moveFolderSchema,
  moveProductsSchema,
  renameFolderSchema,
} from "./products.validation";

const router = Router();

// All folder routes require authentication
router.use(authenticate);

router.post(
  "/",
  validate(createFolderSchema),
  assetFoldersController.createFolder,
);
router.get("/", assetFoldersController.getFolderTree);
router.patch(
  "/:id",
  validate(renameFolderSchema),
  assetFoldersController.renameFolder,
);
router.delete("/:id", assetFoldersController.deleteFolder);
router.post(
  "/move",
  validate(moveProductsSchema),
  assetFoldersController.moveProducts,
);
router.patch(
  "/:id/move",
  validate(moveFolderSchema),
  assetFoldersController.moveFolder,
);

export default router;
