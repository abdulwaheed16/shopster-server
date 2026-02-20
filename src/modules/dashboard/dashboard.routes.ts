import { Router } from "express";
import { UserRole } from "../../common/constants/roles.constant";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { authorize } from "../../common/middlewares/role.middleware";
import { dashboardController } from "./dashboard.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get("/", dashboardController.getUserStats.bind(dashboardController));

router.get(
  "/admin",
  authorize(UserRole.ADMIN),
  dashboardController.getAdminStats.bind(dashboardController)
);


export default router;
