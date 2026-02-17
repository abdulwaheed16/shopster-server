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

/**
 * @swagger
 * /upload/image:
 *   post:
 *     summary: Upload single image
 *     description: Uploads a single image to Cloudinary.
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: No image provided or invalid file type
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/image",
  upload.single("image"),
  uploadController.uploadImage.bind(uploadController),
);

/**
 * @swagger
 * /upload/images:
 *   post:
 *     summary: Upload multiple images
 *     description: Uploads multiple images to Cloudinary (max 10).
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *       400:
 *         description: No images provided or invalid file type
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/images",
  upload.array("images", 10),
  uploadController.uploadImages.bind(uploadController),
);

/**
 * @swagger
 * /upload/video:
 *   post:
 *     summary: Upload single video
 *     description: Uploads a single video to Vercel Blob.
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Video uploaded successfully
 *       400:
 *         description: No video provided or invalid file type
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/video",
  videoUpload.single("video"),
  uploadController.uploadVideo.bind(uploadController),
);

/**
 * @swagger
 * /upload/{publicId}:
 *   delete:
 *     summary: Delete image
 *     description: Deletes an image from Cloudinary.
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cloudinary public ID (URL encoded)
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete(
  "/:publicId",
  validate(deleteImageSchema),
  uploadController.deleteImage.bind(uploadController),
);

export default router;
