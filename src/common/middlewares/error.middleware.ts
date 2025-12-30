import { NextFunction, Request, Response } from "express";
import { ApiError } from "../errors/api-error";
import { errorHandler } from "../errors/error-handler";

export { errorHandler };

// 404 handler - must be placed before error handler
export const notFoundHandler = (
  req: Request,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _res: Response,
  next: NextFunction
): void => {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
};
