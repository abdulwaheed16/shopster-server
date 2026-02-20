import { NextFunction, Request, Response } from "express";
import { config } from "../../config/env.config";
import Logger from "../logging/logger";

export const sseMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Disable connection timeout for long-running processes
  req.setTimeout(0);
  res.setTimeout(0);

  // Determine allowed origin for SSE
  const origin = req.headers.origin;
  const allowedOrigins = config.cors.origin;

  const isAllowed =
    !origin ||
    allowedOrigins.includes(origin) ||
    origin.endsWith("ngrok-free.app") ||
    origin.startsWith("http://localhost:") ||
    origin.startsWith("http://127.0.0.1:");

  Logger.info("origin", origin);
  Logger.info("allowedOrigins", allowedOrigins);
  Logger.info("isAllowed", isAllowed);

  const corsOrigin = isAllowed
    ? origin || allowedOrigins[0]
    : allowedOrigins[0];

  Logger.info(
    `[SSE-Middleware] Origin: ${origin}, Applied CORS-Origin: ${corsOrigin}`,
  );

  // Set SSE and CORS headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", corsOrigin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("X-Accel-Buffering", "no");

  // Keep-alive for some proxies
  res.write(": ok\n\n");

  res.flushHeaders();

  next();
};
