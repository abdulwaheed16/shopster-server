import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { uploadController } from "./upload.controller";
import { deleteImageSchema } from "./upload.validation";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Configure multer for MEMORY storage only (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory, not disk
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 10, // Max 10 files at once
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Configure multer for VIDEO uploads
const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Only allow video files
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"));
    }
  },
});

router.post(
  "/image",
  upload.single("image"),
  uploadController.uploadImage.bind(uploadController),
);

router.post(
  "/images",
  upload.array("images", 10),
  uploadController.uploadImages.bind(uploadController),
);

router.post(
  "/video",
  videoUpload.single("video"),
  uploadController.uploadVideo.bind(uploadController),
);

router.delete(
  "/:publicId",
  validate(deleteImageSchema),
  uploadController.deleteImage.bind(uploadController),
);

export default router;
