import { NextFunction, Request, Response } from "express";
import { ApiError } from "../../common/errors/api-error";
import { sendSuccess } from "../../common/utils/response.util";
import { billingService } from "./billing.service";

export class BillingController {
  // Create Checkout Session
  async createCheckoutSession(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await billingService.createCheckoutSession(
        userId,
        req.body
      );
      sendSuccess(res, "Checkout session created", result);
    } catch (error) {
      next(error);
    }
  }

  // Create Portal Session
  async createPortalSession(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await billingService.createPortalSession(userId, req.body);
      sendSuccess(res, "Portal session created", result);
    } catch (error) {
      next(error);
    }
  }

  // Get Plans
  async getPlans(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await billingService.syncPlans();
      sendSuccess(res, "Plans retrieved successfully", result);
    } catch (error) {
      next(error);
    }
  }

  // Stripe Webhook handler
  async handleWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const signature = req.headers["stripe-signature"] as string;
      const rawBody = (req as any).rawBody;

      if (!signature || !rawBody) {
        throw ApiError.badRequest("Missing stripe-signature or raw body");
      }

      const result = await billingService.handleWebhook(signature, rawBody);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Admin: Update Custom Plan
  async updateCustomPlan(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const adminId = req.user!.id;
      const result = await billingService.updateCustomPlan(adminId, req.body);
      sendSuccess(res, "Custom plan updated successfully", result);
    } catch (error) {
      next(error);
    }
  }
}

export const billingController = new BillingController();
