import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application } from "express";
import "express-async-errors"; // Must be imported before routes
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import {
  errorHandler,
  notFoundHandler,
} from "./common/middlewares/error.middleware";
import { apiLimiter } from "./common/middlewares/rate-limit.middleware";
import { config } from "./config/env.config";
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
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        const allowedOrigins = config.cors.origin;
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          if (config.server.isDevelopment) {
            console.log(`CORS blocked for origin: ${origin}`);
            console.log(`Allowed origins:`, allowedOrigins);
          }
          callback(null, false);
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "ngrok-skip-browser-warning",
      ],
    })
  );

  // Body parsing middleware
  app.use(
    express.json({
      limit: "10mb",
      verify: (req: any, res: any, buf: Buffer) => {
        if (
          req.originalUrl.includes("/shopify/webhooks") ||
          req.originalUrl.includes("/billing/webhooks")
        ) {
          req.rawBody = buf;
        }
      },
    })
  );
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Cookie parser
  app.use(cookieParser(config.server.cookieSecret));

  // Logging middleware (only in development)
  if (config.server.isDevelopment) {
    app.use(morgan("dev"));
  } else {
    app.use(morgan("combined"));
  }

  // Rate limiting (apply to all routes)
  app.use(apiLimiter);

  // Swagger documentation
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Shopster API Documentation",
    })
  );

  // API routes
  app.use(routes);

  // 404 handler (must be after all routes)
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
};

// Docker Redis commands

// # Run Redis in Docker
// docker run -d -p 6379:6379 --name shopster-redis redis:alpine

// # Verify
// docker ps | grep redis
