import { NextFunction, Request, Response } from "express";
import { ApiError } from "../../common/errors/api-error";
import { sendSuccess } from "../../common/utils/response.util";
import { billingService } from "./billing.service";
import {
  CreateCheckoutSessionBody,
  CreatePortalSessionBody,
  UpdateCustomPlanBody,
} from "./billing.validation";
import { subscriptionService } from "./subscription.service";

export class BillingController {
  // Create Checkout Session
  async createCheckoutSession(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: CreateCheckoutSessionBody = req.body;

      const result = await billingService.createCheckoutSession(userId, data);

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
      const data: CreatePortalSessionBody = req.body;
      const result = await billingService.createPortalSession(userId, data);
      sendSuccess(res, "Portal session created", result);
    } catch (error) {
      next(error);
    }
  }

  // Get Active Plans
  async getPlans(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await billingService.getActivePlans();

      console.log("Plans: server ", result);

      sendSuccess(res, "Plans retrieved successfully", result);
    } catch (error) {
      next(error);
    }
  }

  // Get Current Subscription
  async getCurrentSubscription(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await subscriptionService.getSubscriptionByUserId(userId);
      sendSuccess(res, "Current subscription retrieved", result);
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
      const data: UpdateCustomPlanBody = req.body;
      const result = await billingService.updateCustomPlan(adminId, data);
      sendSuccess(res, "Custom plan updated successfully", result);
    } catch (error) {
      next(error);
    }
  }

  // Get Single Plan
  async getPlan(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await billingService.getPlanById(req.params.id);
      sendSuccess(res, "Plan retrieved successfully", result);
    } catch (error) {
      next(error);
    }
  }

  // Cancel Subscription
  async cancelSubscription(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await billingService.cancelSubscription(userId);
      sendSuccess(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  // Get Invoices
  async getInvoices(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { page, limit, status, userId: queryUserId } = req.query;

      // Only admins can view other people's invoices
      const targetUserId =
        req.user!.role === "ADMIN" && queryUserId
          ? (queryUserId as string)
          : req.user!.id;

      const result = await billingService.getInvoices(targetUserId, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        status: status as string,
      });

      sendSuccess(res, "Invoices retrieved successfully", result);
    } catch (error) {
      next(error);
    }
  }

  // Get Payment Methods
  async getPaymentMethods(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await billingService.getPaymentMethods(userId);
      sendSuccess(res, "Payment methods retrieved successfully", result);
    } catch (error) {
      next(error);
    }
  }

  // Admin: Get User Usage Records
  async getUserUsage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const result = await billingService.getUserUsage(userId);
      sendSuccess(res, "Usage records retrieved successfully", result);
    } catch (error) {
      next(error);
    }
  }
}

export const billingController = new BillingController();
