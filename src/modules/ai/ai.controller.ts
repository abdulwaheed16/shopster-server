import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AI_PROVIDERS } from "./ai.constants";
import { aiService } from "./ai.service";

// Controller for AI module testing and internal operations.
class AIController {
  async testGeminiText(req: Request, res: Response) {
    const { prompt, systemPrompt, maxTokens, temperature } = req.body;

    if (!prompt) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Prompt is required",
      });
    }

    try {
      const result = await aiService.generateText(
        {
          prompt,
          systemPrompt,
          maxTokens: maxTokens ? parseInt(maxTokens) : undefined,
          temperature: temperature ? parseFloat(temperature) : undefined,
        },
        AI_PROVIDERS.GEMINI
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        data: {
          provider: AI_PROVIDERS.GEMINI,
          result,
        },
      });
    } catch (error: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // General text generation test (can specify provider).
  async testTextGeneration(req: Request, res: Response) {
    const { prompt, provider, systemPrompt } = req.body;

    if (!prompt) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Prompt is required",
      });
    }

    try {
      const result = await aiService.generateText(
        { prompt, systemPrompt },
        provider || AI_PROVIDERS.GEMINI
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        data: {
          provider: provider || AI_PROVIDERS.GEMINI,
          result,
        },
      });
    } catch (error: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export const aiController = new AIController();
