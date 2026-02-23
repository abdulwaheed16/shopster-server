import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { uploadController } from "./upload.controller";
import { deleteImageSchema } from "./upload.validation";

const router = Router();

router.use(authenticate);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"));
    }
  },
});

router.post(
  "/image",
  // hasPermissions(Permission.UPLOAD_IMAGES),
  upload.single("image"),
  uploadController.uploadImage.bind(uploadController),
);

router.post(
  "/images",
  // hasPermissions(Permission.UPLOAD_IMAGES),
  upload.array("images", 10),
  uploadController.uploadImages.bind(uploadController),
);

router.post(
  "/video",
  // hasPermissions(Permission.UPLOAD_VIDEOS),
  videoUpload.single("video"),
  uploadController.uploadVideo.bind(uploadController),
);

router.delete(
  "/:publicId",
  // hasPermissions(Permission.DELETE_UPLOAD),
  validate(deleteImageSchema),
  uploadController.deleteImage.bind(uploadController),
);

export default router;
