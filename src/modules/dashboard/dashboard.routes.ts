import { Router } from "express";
import { Permission } from "../../common/constants/permissions.constant";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { hasPermissions } from "../../common/middlewares/permission.middleware";
import { dashboardController } from "./dashboard.controller";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  hasPermissions(Permission.VIEW_USER_DASHBOARD),
  dashboardController.getUserStats.bind(dashboardController),
);

router.get(
  "/admin",
  hasPermissions(Permission.VIEW_ADMIN_DASHBOARD),
  dashboardController.getAdminStats.bind(dashboardController),
);

export default router;
