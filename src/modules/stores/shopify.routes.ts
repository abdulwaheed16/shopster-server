import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { storesController } from "./stores.controller";
import { shopifyAuthSchema, shopifyCallbackSchema } from "./stores.validation";

const router = Router();

router.get(
  "/auth",
  authenticate,
  validate(shopifyAuthSchema),
  storesController.initiateShopifyAuth.bind(storesController),
);

router.get(
  "/callback",
  validate(shopifyCallbackSchema),
  storesController.shopifyAuthCallback.bind(storesController),
);

router.post(
  "/webhooks",
  storesController.handleShopifyWebhook.bind(storesController),
);

export default router;
