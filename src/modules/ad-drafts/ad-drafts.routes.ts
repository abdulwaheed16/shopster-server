import { Router } from "express";
import { Permission } from "../../common/constants/permissions.constant";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { hasPermissions } from "../../common/middlewares/permission.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { adDraftsController } from "./ad-drafts.controller";
import { upsertAdDraftSchema } from "./ad-drafts.validation";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  hasPermissions(Permission.MANAGE_AD_DRAFTS),
  adDraftsController.getCurrentDraft.bind(adDraftsController),
);

router.post(
  "/",
  hasPermissions(Permission.MANAGE_AD_DRAFTS),
  validate(upsertAdDraftSchema),
  adDraftsController.upsertDraft.bind(adDraftsController),
);

router.delete(
  "/",
  hasPermissions(Permission.MANAGE_AD_DRAFTS),
  adDraftsController.deleteDraft.bind(adDraftsController),
);

export default router;
