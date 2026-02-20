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

router.get("/profile", settingsController.getProfile.bind(settingsController));

router.put(
  "/profile",
  validate(updateProfileSchema),
  settingsController.updateProfile.bind(settingsController),
);

router.get(
  "/security",
  settingsController.getSecurity.bind(settingsController),
);

router.put(
  "/security",
  validate(updateSecuritySchema),
  settingsController.updateSecurity.bind(settingsController),
);

router.post(
  "/security/2fa/enable",
  settingsController.enable2FA.bind(settingsController),
);

router.post(
  "/security/2fa/disable",
  settingsController.disable2FA.bind(settingsController),
);

export default router;
