import { Router } from "express";
import { UserRole } from "../../common/constants/roles.constant";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { authorize } from "../../common/middlewares/role.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import * as CommonValidators from "../../common/validations/common.validation";
import { jobsController } from "./jobs.controller";
import { getJobsSchema } from "./jobs.validation";

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

router.get(
  "/",
  validate(getJobsSchema),
  jobsController.getJobs.bind(jobsController),
);

router.get(
  "/:id",
  validate(CommonValidators.idSchema),
  jobsController.getJobById.bind(jobsController),
);

export default router;
