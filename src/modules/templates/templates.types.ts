import { Template } from "@prisma/client";
import { PaginatedResponse } from "../../common/utils/pagination.util";
import {
  CreateTemplateBody,
  GeneratePreviewBody,
  GetTemplatesQuery,
  UpdateTemplateBody,
} from "./templates.validation";

export interface ITemplatesService {
  getTemplates(
    userId: string,
    query: GetTemplatesQuery
  ): Promise<PaginatedResponse<unknown>>;
  getTemplateById(id: string, userId: string): Promise<Template>;
  createTemplate(userId: string, data: CreateTemplateBody): Promise<Template>;
  updateTemplate(
    id: string,
    userId: string,
    data: UpdateTemplateBody
  ): Promise<Template>;
  deleteTemplate(id: string, userId: string): Promise<void>;
  bulkDeleteTemplates(
    userId: string,
    ids: string[]
  ): Promise<{ count: number; message: string }>;
  generatePreview(
    userId: string,
    data: GeneratePreviewBody
  ): Promise<{ message: string; templateId: string }>;
}
