import { Request, Response } from "express";
import { prisma } from "../config/database.config";
import { connection as redisConnection } from "../config/queue.config";

/**
 * Liveness probe - Is the application running?
 * Returns 200 if the app is alive
 */
export const livenessCheck = async (
  req: Request,
  res: Response,
): Promise<void> => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

/**
 * Readiness probe - Can the application handle traffic?
 * Checks database and Redis connections
 */
export const readinessCheck = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const checks: Record<string, { status: string; message?: string }> = {};

  // Check database connection
  try {
    await prisma.user.findFirst({ take: 1 });
    checks.database = { status: "ok" };
  } catch (error) {
    checks.database = {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Check Redis connection
  try {
    await redisConnection.ping();
    checks.redis = { status: "ok" };
  } catch (error) {
    checks.redis = {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Determine overall status
  const isReady = Object.values(checks).every((check) => check.status === "ok");

  res.status(isReady ? 200 : 503).json({
    status: isReady ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    checks,
  });
};

/**
 * Startup probe - Has the application finished initializing?
 * Similar to readiness but used during startup
 */
export const startupCheck = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const checks: Record<string, { status: string; message?: string }> = {};

  // Check database connection
  try {
    await prisma.user.findFirst({ take: 1 });
    checks.database = { status: "ok" };
  } catch (error) {
    checks.database = {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Check Redis connection
  try {
    await redisConnection.ping();
    checks.redis = { status: "ok" };
  } catch (error) {
    checks.redis = {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Determine overall status
  const isStarted = Object.values(checks).every(
    (check) => check.status === "ok",
  );

  res.status(isStarted ? 200 : 503).json({
    status: isStarted ? "ok" : "starting",
    timestamp: new Date().toISOString(),
    checks,
  });
};

/**
 * General health check endpoint
 * Provides comprehensive health information
 */
export const healthCheck = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const checks: Record<string, { status: string; message?: string }> = {};

  // Check database connection
  try {
    await prisma.user.findFirst({ take: 1 });
    checks.database = { status: "ok" };
  } catch (error) {
    checks.database = {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Check Redis connection
  try {
    await redisConnection.ping();
    checks.redis = { status: "ok" };
  } catch (error) {
    checks.redis = {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Determine overall status
  const isHealthy = Object.values(checks).every(
    (check) => check.status === "ok",
  );

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: "MB",
    },
    checks,
  });
};
