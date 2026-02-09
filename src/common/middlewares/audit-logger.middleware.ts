import { NextFunction, Request, Response } from "express";
import { prisma } from "../../config/database.config";
import Logger from "../logging/logger";

export const auditLogger = (action: string, resource: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.json;

    res.json = function (body) {
      res.json = originalSend;

      // Fire and forget audit log
      (async () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
            await prisma.auditLog.create({
              data: {
                userId: req.user.id,
                action,
                resource,
                resourceId: req.params.id || body.data?.id,
                details: body,
                ipAddress: req.ip,
                userAgent: req.get("user-agent"),
              },
            });
          }
        } catch (error) {
          Logger.error("Failed to create audit log", error);
        }
      })();

      return originalSend.call(this, body);
    };

    next();
  };
};
