import { NextFunction, Request, Response } from "express";
import { MESSAGES } from "../../common/constants/messages.constant";
import { sendPaginated, sendSuccess } from "../../common/utils/response.util";
import {
  planAdminService,
  subscriptionAdminService,
} from "./admin-billing.service";
import {
  AdjustCreditsBody,
  CreatePlanBody,
  CreateSubscriptionBody,
  UpdatePlanBody,
  UpdateSubscriptionBody,
} from "./billing.validation";
import { creditsService } from "./credits.service";

export class AdminBillingController {
  // ─── Plans ──────────────────────────────────────────────────────────────────

  async getPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await planAdminService.getPlans(req.query);
      sendPaginated(res, MESSAGES.BILLING.PLANS_FETCHED, result);
    } catch (error) {
      next(error);
    }
  }

  async getPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await planAdminService.getPlanById(req.params.id);
      sendSuccess(res, MESSAGES.BILLING.PLAN_FETCHED, plan);
    } catch (error) {
      next(error);
    }
  }

  async createPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const body: CreatePlanBody = req.body;
      const plan = await planAdminService.createPlan(body);
      sendSuccess(res, "Plan created successfully", plan, 201);
    } catch (error) {
      next(error);
    }
  }

  async updatePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const body: UpdatePlanBody = req.body;
      const plan = await planAdminService.updatePlan(req.params.id, body);
      sendSuccess(res, MESSAGES.BILLING.PLAN_UPDATED, plan);
    } catch (error) {
      next(error);
    }
  }

  async deletePlan(req: Request, res: Response, next: NextFunction) {
    try {
      await planAdminService.deletePlan(req.params.id);
      sendSuccess(res, "Plan deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  // ─── Subscriptions ───────────────────────────────────────────────────────────

  async getSubscriptions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await subscriptionAdminService.getSubscriptions(req.query);
      sendPaginated(res, "Subscriptions fetched", result);
    } catch (error) {
      next(error);
    }
  }

  async getSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await subscriptionAdminService.getSubscriptionById(
        req.params.id,
      );
      sendSuccess(res, "Subscription fetched", sub);
    } catch (error) {
      next(error);
    }
  }

  async createSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const body: CreateSubscriptionBody = req.body;
      const sub = await subscriptionAdminService.createSubscription(body);
      sendSuccess(res, "Subscription created successfully", sub, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const body: UpdateSubscriptionBody = req.body;
      const sub = await subscriptionAdminService.updateSubscription(
        req.params.id,
        body,
      );
      sendSuccess(res, "Subscription updated successfully", sub);
    } catch (error) {
      next(error);
    }
  }

  async cancelSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await subscriptionAdminService.cancelSubscription(
        req.params.id,
      );
      sendSuccess(res, "Subscription cancelled successfully", sub);
    } catch (error) {
      next(error);
    }
  }

  async getUserSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await subscriptionAdminService.getUserSubscription(
        req.params.userId,
      );
      sendSuccess(res, "User subscription fetched", sub);
    } catch (error) {
      next(error);
    }
  }

  // ─── Credits ─────────────────────────────────────────────────────────────────

  async adjustCredits(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const body: AdjustCreditsBody = req.body;

      await creditsService.addCredits(
        userId,
        body.creditAmount,
        body.type as any,
        body.description,
      );
      const balance = await creditsService.getBalance(userId);
      sendSuccess(res, "Credits adjusted successfully", { balance });
    } catch (error) {
      next(error);
    }
  }

  async getUserCredits(req: Request, res: Response, next: NextFunction) {
    try {
      const balance = await creditsService.getBalance(req.params.userId);
      sendSuccess(res, "User credits fetched", { balance });
    } catch (error) {
      next(error);
    }
  }
}

export const adminBillingController = new AdminBillingController();
