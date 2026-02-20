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
