import { Router } from "express";
import { Permission } from "../../common/constants/permissions.constant";
import { UserRole } from "../../common/constants/roles.constant";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { hasPermissions } from "../../common/middlewares/permission.middleware";
import { authorize } from "../../common/middlewares/role.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { settingsController } from "./settings.controller";
import {
  updateAppSettingsSchema,
  updateProfileSchema,
  updateSecuritySchema,
} from "./settings.validation";

const router = Router();

router.use(authenticate);

router.get(
  "/profile",
  hasPermissions(Permission.VIEW_PROFILE_SETTINGS),
  settingsController.getProfile.bind(settingsController),
);

router.put(
  "/profile",
  hasPermissions(Permission.EDIT_PROFILE_SETTINGS),
  validate(updateProfileSchema),
  settingsController.updateProfile.bind(settingsController),
);

router.get(
  "/security",
  hasPermissions(Permission.VIEW_SECURITY_SETTINGS),
  settingsController.getSecurity.bind(settingsController),
);

router.put(
  "/security",
  hasPermissions(Permission.EDIT_SECURITY_SETTINGS),
  validate(updateSecuritySchema),
  settingsController.updateSecurity.bind(settingsController),
);

router.post(
  "/security/2fa/enable",
  hasPermissions(Permission.MANAGE_2FA),
  settingsController.enable2FA.bind(settingsController),
);

router.post("/security/2fa/disable", authenticate, (req, res, next) =>
  settingsController.disable2FA(req, res, next),
);

// Global App Settings
router.get("/app", (req, res, next) =>
  settingsController.getAppSettings(req, res, next),
);

router.patch(
  "/app",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(updateAppSettingsSchema),
  (req, res, next) => settingsController.updateAppSettings(req, res, next),
);

export default router;
