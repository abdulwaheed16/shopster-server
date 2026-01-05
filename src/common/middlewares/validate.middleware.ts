import { NextFunction, Request, Response } from "express";
import { ZodError, ZodObject } from "zod";
import { ApiError } from "../errors/api-error";

export const validate = (schema: ZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      req.body = parsed.body;
      req.query = parsed.query as any;
      req.params = parsed.params as any;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          // error.errors was not defined
          path: err.path.join("."),
          message: err.message,
        }));
        next(ApiError.validation("Validation failed", errors));
      } else {
        next(error);
      }
    }
  };
};
