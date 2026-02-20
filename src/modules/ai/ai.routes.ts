import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { aiController } from "./ai.controller";

const router = Router();

// Require authentication for all AI testing routes
router.use(authenticate);

router.post("/test/gemini", aiController.testGeminiText.bind(aiController));

router.post("/test/text", aiController.testTextGeneration.bind(aiController));


export default router;
