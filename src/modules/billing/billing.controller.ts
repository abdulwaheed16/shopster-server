import { NextFunction, Request, Response } from "express";
import { MESSAGES } from "../../common/constants/messages.constant";
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
  async createCheckoutSession(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: CreateCheckoutSessionBody = req.body;

      const result = await billingService.createCheckoutSession(userId, data);

      sendSuccess(res, MESSAGES.BILLING.CHECKOUT_CREATED, result);
    } catch (error) {
      next(error);
    }
  }

  async createPortalSession(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: CreatePortalSessionBody = req.body;
      const result = await billingService.createPortalSession(userId, data);
      sendSuccess(res, MESSAGES.BILLING.PORTAL_CREATED, result);
    } catch (error) {
      next(error);
    }
  }

  async getPlans(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await billingService.getActivePlans();

      sendSuccess(res, MESSAGES.BILLING.PLANS_FETCHED, result);
    } catch (error) {
      next(error);
    }
  }

  async getCurrentSubscription(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await subscriptionService.getSubscriptionByUserId(userId);
      sendSuccess(res, MESSAGES.BILLING.SUBSCRIPTION_FETCHED, result);
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(
    req: Request,
    res: Response,
    next: NextFunction,
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

  async updateCustomPlan(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const adminId = req.user!.id;
      const data: UpdateCustomPlanBody = req.body;
      const result = await billingService.updateCustomPlan(adminId, data);
      sendSuccess(res, MESSAGES.BILLING.PLAN_UPDATED, result);
    } catch (error) {
      next(error);
    }
  }

  async getPlan(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await billingService.getPlanById(req.params.id);
      sendSuccess(res, MESSAGES.BILLING.PLAN_FETCHED, result);
    } catch (error) {
      next(error);
    }
  }

  async cancelSubscription(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await billingService.cancelSubscription(userId);
      sendSuccess(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  async getInvoices(
    req: Request,
    res: Response,
    next: NextFunction,
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

      sendSuccess(res, MESSAGES.BILLING.INVOICES_FETCHED, result);
    } catch (error) {
      next(error);
    }
  }

  async getPaymentMethods(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await billingService.getPaymentMethods(userId);
      sendSuccess(res, MESSAGES.BILLING.PAYMENT_METHODS_FETCHED, result);
    } catch (error) {
      next(error);
    }
  }

  async getUserUsage(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const result = await billingService.getUserUsage(userId);
      sendSuccess(res, MESSAGES.BILLING.USAGE_FETCHED, result);
    } catch (error) {
      next(error);
    }
  }
}

export const billingController = new BillingController();
