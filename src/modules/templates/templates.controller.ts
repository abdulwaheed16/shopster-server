import { NextFunction, Request, Response } from "express";
import {
  sendCreated,
  sendPaginated,
  sendSuccess,
} from "../../common/utils/response.util";
import { templatesService } from "./templates.service";
import {
  CreateTemplateInput,
  GeneratePreviewInput,
  GetTemplatesQuery,
  UpdateTemplateInput,
} from "./templates.validation";

export class TemplatesController {
  // Get all templates --- GET /templates
  async getTemplates(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const query: GetTemplatesQuery = req.query;

      const result = await templatesService.getTemplates(userId, query);

      sendPaginated(res, "Templates fetched successfully", result);
    } catch (error) {
      next(error);
    }
  }

  // Get template by ID --- GET /templates/:id
  async getTemplateById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const template = await templatesService.getTemplateById(id, userId);

      sendSuccess(res, "Template fetched successfully", template);
    } catch (error) {
      next(error);
    }
  }

  // Create template --- POST /templates
  async createTemplate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: CreateTemplateInput = req.body;

      const template = await templatesService.createTemplate(userId, data);

      sendCreated(res, "Template created successfully", template);
    } catch (error) {
      next(error);
    }
  }

  // Update template --- PUT /templates/:id
  async updateTemplate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const data: UpdateTemplateInput = req.body;

      const template = await templatesService.updateTemplate(id, userId, data);

      sendSuccess(res, "Template updated successfully", template);
    } catch (error) {
      next(error);
    }
  }

  // Delete template --- DELETE /templates/:id
  async deleteTemplate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await templatesService.deleteTemplate(id, userId);

      sendSuccess(res, "Template deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  // Generate preview --- POST /templates/preview
  async generatePreview(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: GeneratePreviewInput = req.body;

      const result = await templatesService.generatePreview(userId, data);

      sendSuccess(res, result.message, { templateId: result.templateId });
    } catch (error) {
      next(error);
    }
  }

  // Bulk delete templates --- POST /templates/bulk-delete
  async bulkDeleteTemplates(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { ids } = req.body;

      const result = await templatesService.bulkDeleteTemplates(userId, ids);

      sendSuccess(res, `${result.count} templates deleted successfully`, {
        count: result.count,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const templatesController = new TemplatesController();
