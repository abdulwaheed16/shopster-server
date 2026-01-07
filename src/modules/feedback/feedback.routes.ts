import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
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
  validate(createFeedbackSchema),
  feedbackController.submitFeedback.bind(feedbackController)
);
router.get("/my", feedbackController.getMyFeedback.bind(feedbackController));

// Admin routes
router.get("/", feedbackController.getAllFeedback.bind(feedbackController));
router.get("/:id", feedbackController.getFeedbackById.bind(feedbackController));
router.patch(
  "/:id/status",
  validate(updateFeedbackStatusSchema),
  feedbackController.updateFeedbackStatus.bind(feedbackController)
);

export default router;
