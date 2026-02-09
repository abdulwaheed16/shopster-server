import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application } from "express";
import "express-async-errors"; // Must be imported before routes
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import { errorHandler } from "./common/middlewares/error.middleware";
import { requestLogger } from "./common/monitoring/metrics";
import { config } from "./config/env.config";
import { morganStream } from "./config/logger.config";
import { swaggerSpec } from "./config/swagger.config";
import routes from "./routes/index";

export const createApp = (): Application => {
  const app = express();

  // Trust Proxy for Ngrok/Cloudinary/Heroku
  app.set("trust proxy", 1);

  // Security middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        const allowedOrigins = config.cors.origin;
        // In development, be more permissive
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          (config.server.isDevelopment &&
            (origin.includes("localhost") || origin.includes("ngrok-free.app")))
        ) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "ngrok-skip-browser-warning",
      ],
    }),
  );

  // Body parsing middleware
  app.use(
    express.json({
      limit: "10mb",
      // @ts-ignore
      verify: (req: any, res: any, buf: Buffer) => {
        if (
          req.originalUrl.includes("/shopify/webhooks") ||
          req.originalUrl.includes("/billing/webhooks") ||
          req.originalUrl.includes("/stripe/webhooks")
        ) {
          req.rawBody = buf;
        }
      },
    }),
  );
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Cookie parser
  app.use(cookieParser(config.server.cookieSecret));

  // Logging middleware with Winston
  if (config.server.isDevelopment) {
    app.use(morgan("dev", { stream: morganStream }));
  } else {
    app.use(morgan("combined", { stream: morganStream }));
  }

  // Request Duration Logging
  app.use(requestLogger);

  // Swagger documentation
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Shopster API Documentation",
    }),
  );

  // API routes
  app.use(routes);

  // 404 handler (must be after all routes)
  app.use((req, res) => {
    res.status(404).json({
      status: "fail",
      message: `Route ${req.originalUrl} not found`,
    });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
};

// Docker Redis commands

// # Run Redis in Docker
// docker run -d -p 6379:6379 --name shopster-redis redis:alpine

// # Verify
// docker ps | grep redis

// # Start
// docker start shopster-redis

// # Stop
// docker stop shopster-redis

// # Remove
// docker rm shopster-redis

// # Inspect
// docker inspect shopster-redis
