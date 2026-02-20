import { Router } from "express";
import {
  healthCheck,
  livenessCheck,
  readinessCheck,
  startupCheck,
} from "./health.controller";

const router = Router();

router.get("/", healthCheck);

router.get("/liveness", livenessCheck);

router.get("/readiness", readinessCheck);

router.get("/startup", startupCheck);

export default router;
