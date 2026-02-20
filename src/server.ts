import { config as envConfig } from "dotenv";
import path from "path";

// Load environment variables as early as possible with absolute path
envConfig({ path: path.join(process.cwd(), ".env") });

import { createApp } from "./app";
import {
  handleUncaughtException,
  handleUnhandledRejection,
} from "./common/errors/error-handler";
import Logger from "./common/logging/logger";
import { disconnectDatabase } from "./config/database.config";
import { config } from "./config/env.config";
import { initializeWorkers, shutdownWorkers } from "./queues";

// Handle uncaught exceptions
process.on("uncaughtException", handleUncaughtException);

// Handle unhandled promise rejections
process.on("unhandledRejection", handleUnhandledRejection);

const startServer = async () => {
  try {
    if (process.env.WORKER_MODE !== "false") {
      initializeWorkers();
    } else {
      Logger.info(
        "Running in API-only mode. Workers are disabled in this process.",
      );
    }

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(config.server.port, () => {
      Logger.info("Server is running!");
      Logger.info(`Environment: ${config.server.env}`);
      Logger.info(`Port: ${config.server.port}`);
      Logger.info(`API Docs: http://localhost:${config.server.port}/api-docs`);
      Logger.info(
        `Health Check: http://localhost:${config.server.port}/health`,
      );
    });

    // Graceful shutdown
    let isShuttingDown = false;

    const gracefulShutdown = async (signal: string) => {
      if (isShuttingDown) {
        Logger.warn("Shutdown already in progress...");
        return;
      }

      isShuttingDown = true;
      Logger.info(`\n${signal} received. Starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        Logger.info("HTTP server closed (no new connections)");

        try {
          // Shutdown queue workers
          await shutdownWorkers();
          Logger.info("Queue workers shut down");

          // Disconnect from database
          await disconnectDatabase();
          Logger.info("Database disconnected");

          Logger.info("Graceful shutdown completed");
          process.exit(0);
        } catch (error) {
          Logger.error("Error during shutdown:", error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        Logger.error(
          "Forced shutdown after 30s timeout (in-flight requests didn't complete)",
        );
        process.exit(1);
      }, 30000);
    };

    // Listen for termination signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    Logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
