import { NextFunction, Request, Response } from "express";
import { MESSAGES } from "../../common/constants/messages.constant";
import { ApiError } from "../../common/errors/api-error";
import {
  sendCreated,
  sendPaginated,
  sendSuccess,
} from "../../common/utils/response.util";
import { templatesService } from "./templates.service";
import {
  CreateTemplateBody,
  GeneratePreviewBody,
  GetTemplatesQuery,
  UpdateTemplateBody,
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
      const query: GetTemplatesQuery = req.query as any;

      const result = await templatesService.getTemplates(userId, query);

      sendPaginated(res, MESSAGES.TEMPLATES.FETCHED, result);
    } catch (error) {
      next(error);
    }
  }

  // Get user's templates --- GET /templates/my
  async getMyTemplates(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const query: GetTemplatesQuery = {
        ...req.query,
        filterType: "mine",
      } as any;

      const result = await templatesService.getTemplates(userId, query);

      sendPaginated(res, MESSAGES.TEMPLATES.USER_FETCHED, result);
    } catch (error) {
      next(error);
    }
  }

  // Get global templates --- GET /templates/general
  async getGeneralTemplates(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const query: GetTemplatesQuery = {
        ...req.query,
        filterType: "others",
      } as any;

      const result = await templatesService.getTemplates(userId, query);

      sendPaginated(res, MESSAGES.TEMPLATES.GLOBAL_FETCHED, result);
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

      sendSuccess(res, MESSAGES.TEMPLATES.FETCHED_ONE, template);
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
      const { id: userId, role } = req.user!;
      if (role !== "ADMIN") {
        throw ApiError.unauthorized("Only admins can create templates");
      }
      const data: CreateTemplateBody = req.body;

      const template = await templatesService.createTemplate(userId, data);

      sendCreated(res, MESSAGES.TEMPLATES.CREATED, template);
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
      const { id: userId, role } = req.user!;
      if (role !== "ADMIN") {
        throw ApiError.unauthorized("Only admins can update templates");
      }
      const { id } = req.params;
      const data: UpdateTemplateBody = req.body;

      const template = await templatesService.updateTemplate(id, userId, data);

      sendSuccess(res, MESSAGES.TEMPLATES.UPDATED, template);
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
      const { id: userId, role } = req.user!;
      if (role !== "ADMIN") {
        throw ApiError.unauthorized("Only admins can delete templates");
      }
      const { id } = req.params;

      await templatesService.deleteTemplate(id, userId);

      sendSuccess(res, MESSAGES.TEMPLATES.DELETED);
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
      const data: GeneratePreviewBody = req.body;

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
      const { id: userId, role } = req.user!;
      if (role !== "ADMIN") {
        throw ApiError.unauthorized("Only admins can perform bulk delete");
      }
      const { ids } = req.body;

      const result = await templatesService.bulkDeleteTemplates(userId, ids);

      sendSuccess(res, `${result.count} templates deleted successfully`, {
        count: result.count,
      });
    } catch (error) {
      next(error);
    }
  }

  // Track visit --- POST /templates/:id/visit
  async trackVisit(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await templatesService.trackVisit(id, userId);
      sendSuccess(res, MESSAGES.TEMPLATES.TRACKED);
    } catch (error) {
      next(error);
    }
  }

  // Toggle like --- POST /templates/:id/like
  async toggleLike(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await templatesService.toggleLike(id, userId);
      sendSuccess(
        res,
        result.liked ? "Template liked" : "Template unliked",
        result
      );
    } catch (error) {
      next(error);
    }
  }

  // Toggle favorite --- POST /templates/:id/favorite
  async toggleFavorite(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await templatesService.toggleFavorite(id, userId);
      sendSuccess(
        res,
        result.favorited ? "Template favorited" : "Template unfavorited",
        result
      );
    } catch (error) {
      next(error);
    }
  }

  // Get admin stats --- GET /templates/admin/stats
  async getAdminStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { role } = req.user!;
      if (role !== "ADMIN") {
        throw ApiError.unauthorized("Only admins can access stats");
      }
      const stats = await templatesService.getAdminStats();
      sendSuccess(res, MESSAGES.TEMPLATES.STATS_FETCHED, stats);
    } catch (error) {
      next(error);
    }
  }
}

export const templatesController = new TemplatesController();
