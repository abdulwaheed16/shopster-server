import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { adDraftsController } from "./ad-drafts.controller";
import { upsertAdDraftSchema } from "./ad-drafts.validation";

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get("/", adDraftsController.getCurrentDraft.bind(adDraftsController));

router.post(
  "/",
  validate(upsertAdDraftSchema),
  adDraftsController.upsertDraft.bind(adDraftsController),
);

router.delete("/", adDraftsController.deleteDraft.bind(adDraftsController));

export default router;
