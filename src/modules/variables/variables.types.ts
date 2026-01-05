import { Variable } from "@prisma/client";
import { PaginatedResponse } from "../../common/utils/pagination.util";
import {
  CreateVariableBody,
  GetVariablesQuery,
  UpdateVariableBody,
} from "./variables.validation";

export interface IVariablesService {
  getVariables(
    userId: string,
    query: GetVariablesQuery
  ): Promise<PaginatedResponse<unknown>>;
  getVariableById(id: string, userId: string): Promise<Variable>;
  getVariableUsage(
    id: string,
    userId: string
  ): Promise<{
    variable: Partial<Variable>;
    usageCount: number;
    usedInTemplates: any[];
  }>;
  createVariable(userId: string, data: CreateVariableBody): Promise<Variable>;
  updateVariable(
    id: string,
    userId: string,
    data: UpdateVariableBody
  ): Promise<Variable>;
  deleteVariable(id: string, userId: string): Promise<void>;
  updateVariableUsage(
    variableId: string,
    templateId: string,
    templateName: string,
    prompt: string,
    previewUrl?: string
  ): Promise<void>;
  removeVariableUsage(variableId: string, templateId: string): Promise<void>;
}
