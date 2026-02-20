import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application } from "express";
import "express-async-errors"; // Must be imported before routes
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
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

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        const allowedOrigins = config.cors.origin;

        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          origin.startsWith("http://localhost:") ||
          origin.startsWith("http://127.0.0.1:") ||
          origin.endsWith("ngrok-free.app") ||
          origin.endsWith("ngrok.io")
        ) {
          // Reflect the origin back if it's allowed, or use the first allowed origin
          // instead of returning 'true' which can default to '*'
          callback(null, origin || allowedOrigins[0]);
        } else {
          console.warn(`[CORS] Origin ${origin} is REJECTED`);
          callback(new Error("Not allowed by CORS"));
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
      optionsSuccessStatus: 200,
    }),
  );

  // Security middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false,
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

  // Serve static assets from the assets directory
  app.use("/assets", express.static(path.join(__dirname, "../assets")));

  // API routes
  app.use(routes);

  app.use((req, res) => {
    res.status(404).json({
      status: "fail",
      message: `Route ${req.originalUrl} not found`,
    });
  });

  app.use(errorHandler);

  return app;
};
