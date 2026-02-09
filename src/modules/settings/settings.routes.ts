import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { settingsController } from "./settings.controller";
import {
  updateProfileSchema,
  updateSecuritySchema,
} from "./settings.validation";

const router = Router();

// All settings routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /settings/profile:
 *   get:
 *     summary: Get profile settings
 *     tags: [Settings]
 */
router.get("/profile", settingsController.getProfile.bind(settingsController));

/**
 * @swagger
 * /settings/profile:
 *   put:
 *     summary: Update profile settings
 *     tags: [Settings]
 */
router.put(
  "/profile",
  validate(updateProfileSchema),
  settingsController.updateProfile.bind(settingsController),
);

/**
 * @swagger
 * /settings/security:
 *   get:
 *     summary: Get security settings
 *     tags: [Settings]
 */
router.get(
  "/security",
  settingsController.getSecurity.bind(settingsController),
);

/**
 * @swagger
 * /settings/security:
 *   put:
 *     summary: Update security settings (Password)
 *     tags: [Settings]
 */
router.put(
  "/security",
  validate(updateSecuritySchema),
  settingsController.updateSecurity.bind(settingsController),
);

/**
 * @swagger
 * /settings/security/2fa/enable:
 *   post:
 *     summary: Enable 2FA (Mock)
 *     tags: [Settings]
 */
router.post(
  "/security/2fa/enable",
  settingsController.enable2FA.bind(settingsController),
);

/**
 * @swagger
 * /settings/security/2fa/disable:
 *   post:
 *     summary: Disable 2FA (Mock)
 *     tags: [Settings]
 */
router.post(
  "/security/2fa/disable",
  settingsController.disable2FA.bind(settingsController),
);

export default router;
