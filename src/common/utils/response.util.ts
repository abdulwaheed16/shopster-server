import { Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.constant";
import { PaginatedResponse } from "./pagination.util";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = HTTP_STATUS.OK
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    ...(data !== undefined && { data }),
  };

  return res.status(statusCode).json(response);
};

export const sendCreated = <T>(
  res: Response,
  message: string,
  data?: T
): Response => {
  return sendSuccess(res, message, data, HTTP_STATUS.CREATED);
};

export const sendPaginated = <T>(
  res: Response,
  message: string,
  paginatedData: PaginatedResponse<T>
): Response => {
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message,
    data: paginatedData.data,
    meta: paginatedData.meta,
  });
};

export const sendNoContent = (res: Response): Response => {
  return res.status(HTTP_STATUS.NO_CONTENT).send();
};
