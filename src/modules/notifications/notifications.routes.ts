import { Router } from "express";
import { Permission } from "../../common/constants/permissions.constant";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { hasPermissions } from "../../common/middlewares/permission.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { notificationsController } from "./notifications.controller";
import {
  getNotificationsQuerySchema,
  markAsReadSchema,
} from "./notifications.validation";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  validate(getNotificationsQuerySchema),
  notificationsController.getMyNotifications.bind(notificationsController),
);

router.get(
  "/unread-count",
  notificationsController.getUnreadCount.bind(notificationsController),
);

router.patch(
  "/mark-all-read",
  notificationsController.markAllAsRead.bind(notificationsController),
);

router.patch(
  "/:id/read",
  validate(markAsReadSchema),
  notificationsController.markAsRead.bind(notificationsController),
);

export default router;
