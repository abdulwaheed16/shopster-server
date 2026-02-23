import { Router } from "express";
import { Permission } from "../../common/constants/permissions.constant";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { hasPermissions } from "../../common/middlewares/permission.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { feedbackController } from "./feedback.controller";
import {
  createFeedbackSchema,
  updateFeedbackStatusSchema,
} from "./feedback.validation";

const router = Router();

router.use(authenticate);

// User routes
router.post(
  "/",
  hasPermissions(Permission.SUBMIT_FEEDBACK),
  validate(createFeedbackSchema),
  feedbackController.submitFeedback.bind(feedbackController),
);

router.get(
  "/my",
  hasPermissions(Permission.VIEW_OWN_FEEDBACK),
  feedbackController.getMyFeedback.bind(feedbackController),
);

// Admin routes
router.get(
  "/",
  hasPermissions(Permission.VIEW_ALL_FEEDBACK),
  feedbackController.getAllFeedback.bind(feedbackController),
);

router.get(
  "/:id",
  hasPermissions(Permission.VIEW_ALL_FEEDBACK),
  feedbackController.getFeedbackById.bind(feedbackController),
);

router.patch(
  "/:id/status",
  hasPermissions(Permission.MANAGE_FEEDBACK),
  validate(updateFeedbackStatusSchema),
  feedbackController.updateFeedbackStatus.bind(feedbackController),
);

export default router;
