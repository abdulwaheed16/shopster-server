import { NextFunction, Request, Response } from "express";
import { logHttp } from "../../config/logger.config";

// Track active requests
let activeRequests = 0;

/**
 * Monitoring middleware to track request metrics
 */
export const monitoringMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const startTime = Date.now();
  activeRequests++;

  // Log request start
  logHttp(`Incoming ${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  // Capture response finish
  res.on("finish", () => {
    activeRequests--;
    const duration = Date.now() - startTime;

    logHttp(`Completed ${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      activeRequests,
    });
  });

  next();
};

/**
 * Get current monitoring metrics
 */
export const getMetrics = () => ({
  activeRequests,
  memory: {
    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    unit: "MB",
  },
  uptime: process.uptime(),
});
