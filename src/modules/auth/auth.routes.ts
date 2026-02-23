import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { authLimiter } from "../../common/middlewares/rate-limit.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { authController } from "./auth.controller";
import {
  changePasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./auth.validation";

const router = Router();

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  authController.register.bind(authController),
);

router.post(
  "/login",
  // authLimiter,
  validate(loginSchema),
  authController.login.bind(authController),
);

router.post(
  "/refresh",
  validate(refreshTokenSchema),
  authController.refreshToken.bind(authController),
);

router.post(
  "/verify-email",
  validate(verifyEmailSchema),
  authController.verifyEmail.bind(authController),
);

router.post(
  "/request-password-reset",
  authLimiter,
  validate(requestPasswordResetSchema),
  authController.requestPasswordReset.bind(authController),
);

router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword.bind(authController),
);

// Protected routes
router.post(
  "/logout",
  authenticate,
  authController.logout.bind(authController),
);

// Get current user profile
router.get(
  "/me",
  authenticate,
  authController.getCurrentUser.bind(authController),
);

router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword.bind(authController),
);

export default router;
