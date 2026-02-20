import { NextFunction, Request, Response } from "express";
import { config } from "../../config/env.config";
import { ApiError } from "../errors/api-error";

export function validateN8nSecret(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const secret = config.webhook.n8nCallbackSecret;

  if (!secret) {
    // Not configured — allow the request through (dev/local environment)
    return next();
  }

  const incomingSecret =
    (req.headers["x-n8n-secret"] as string | undefined) ??
    (req.headers["x-callback-secret"] as string | undefined) ??
    (req.query["secret"] as string | undefined);

  if (!incomingSecret || incomingSecret !== secret) {
    return next(
      ApiError.unauthorized("Invalid or missing n8n callback secret"),
    );
  }

  next();
}
