import { NextFunction, Request, Response } from "express";
import { MESSAGES } from "../../common/constants/messages.constant";
import {
  sendCreated,
  sendPaginated,
  sendSuccess,
} from "../../common/utils/response.util";
import { variablesService } from "./variables.service";
import {
  CreateVariableBody,
  GetVariablesQuery,
  UpdateVariableBody,
} from "./variables.validation";

export class VariablesController {
  async getVariables(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const query: GetVariablesQuery = req.query as any;

      const result = await variablesService.getVariables(userId, query);

      sendPaginated(res, MESSAGES.VARIABLES.FETCHED, result);
    } catch (error) {
      next(error);
    }
  }

  async getVariableById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const variable = await variablesService.getVariableById(id, userId);

      sendSuccess(res, MESSAGES.VARIABLES.FETCHED, variable);
    } catch (error) {
      next(error);
    }
  }

  async getVariableUsage(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const usage = await variablesService.getVariableUsage(id, userId);

      sendSuccess(res, MESSAGES.VARIABLES.USAGE_FETCHED, usage);
    } catch (error) {
      next(error);
    }
  }

  async createVariable(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: CreateVariableBody = req.body;

      const variable = await variablesService.createVariable(userId, data);

      sendCreated(res, MESSAGES.VARIABLES.CREATED, variable);
    } catch (error) {
      next(error);
    }
  }

  async updateVariable(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const data: UpdateVariableBody = req.body;

      const variable = await variablesService.updateVariable(id, userId, data);

      sendSuccess(res, MESSAGES.VARIABLES.UPDATED, variable);
    } catch (error) {
      next(error);
    }
  }

  async deleteVariable(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await variablesService.deleteVariable(id, userId);

      sendSuccess(res, MESSAGES.VARIABLES.DELETED);
    } catch (error) {
      next(error);
    }
  }
}

export const variablesController = new VariablesController();
