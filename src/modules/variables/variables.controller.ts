import { NextFunction, Request, Response } from "express";
import {
  sendCreated,
  sendPaginated,
  sendSuccess,
} from "../../common/utils/response.util";
import { variablesService } from "./variables.service";
import {
  CreateVariableInput,
  GetVariablesQuery,
  UpdateVariableInput,
} from "./variables.validation";

export class VariablesController {
  // Get all variables --- GET /variables
  async getVariables(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const query: GetVariablesQuery = req.query;

      const result = await variablesService.getVariables(userId, query);

      sendPaginated(res, "Variables fetched successfully", result);
    } catch (error) {
      next(error);
    }
  }

  // Get variable by ID --- GET /variables/:id
  async getVariableById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const variable = await variablesService.getVariableById(id, userId);

      sendSuccess(res, "Variable fetched successfully", variable);
    } catch (error) {
      next(error);
    }
  }

  // Get variable usage --- GET /variables/:id/usage
  async getVariableUsage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const usage = await variablesService.getVariableUsage(id, userId);

      sendSuccess(res, "Variable usage fetched successfully", usage);
    } catch (error) {
      next(error);
    }
  }

  // Create variable --- POST /variables
  async createVariable(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: CreateVariableInput = req.body;

      const variable = await variablesService.createVariable(userId, data);

      sendCreated(res, "Variable created successfully", variable);
    } catch (error) {
      next(error);
    }
  }

  // Update variable --- PUT /variables/:id
  async updateVariable(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const data: UpdateVariableInput = req.body;

      const variable = await variablesService.updateVariable(id, userId, data);

      sendSuccess(res, "Variable updated successfully", variable);
    } catch (error) {
      next(error);
    }
  }

  // Delete variable --- DELETE /variables/:id
  async deleteVariable(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await variablesService.deleteVariable(id, userId);

      sendSuccess(res, "Variable deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}

export const variablesController = new VariablesController();
