import { Feedback } from "@prisma/client";
import { PaginatedResponse } from "../../common/utils/pagination.util";
import {
  CreateFeedbackBody,
  UpdateFeedbackStatusBody,
} from "./feedback.validation";

export interface IFeedbackService {
  submitFeedback(userId: string, data: CreateFeedbackBody): Promise<Feedback>;
  getAllFeedback(query: any): Promise<PaginatedResponse<Feedback>>;
  getFeedbackById(id: string): Promise<Feedback | null>;
  updateFeedbackStatus(
    id: string,
    data: UpdateFeedbackStatusBody
  ): Promise<Feedback>;
  getUserFeedback(userId: string): Promise<Feedback[]>;
}
