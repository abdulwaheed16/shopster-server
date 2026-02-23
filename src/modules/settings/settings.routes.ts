import { Router } from "express";
import { Permission } from "../../common/constants/permissions.constant";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { hasPermissions } from "../../common/middlewares/permission.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { settingsController } from "./settings.controller";
import {
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

router.post(
  "/security/2fa/disable",
  hasPermissions(Permission.MANAGE_2FA),
  settingsController.disable2FA.bind(settingsController),
);

export default router;
