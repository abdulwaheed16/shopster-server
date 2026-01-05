import chalk from "chalk";
import { createApp } from "./app";
import {
  handleUncaughtException,
  handleUnhandledRejection,
} from "./common/errors/error-handler";
import {
  disconnectDatabase,
  testDatabaseConnection,
} from "./config/database.config";
import { config } from "./config/env.config";
import { initializeWorkers, shutdownWorkers } from "./queues";

// Handle uncaught exceptions
process.on("uncaughtException", handleUncaughtException);

// Handle unhandled promise rejections
process.on("unhandledRejection", handleUnhandledRejection);

const startServer = async () => {
  try {
    // Test database connection
    const isDbConnected = await testDatabaseConnection();

    if (!isDbConnected) {
      console.error(chalk.red("Failed to connect to database. Exiting..."));
      process.exit(1);
    }

    // Initialize queue workers
    initializeWorkers();

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(config.server.port, () => {
      console.log(chalk.green.bold("Server is running!"));
      console.log(chalk.cyan(`Environment: ${config.server.env}`));
      console.log(chalk.cyan(`Port: ${config.server.port}`));
      console.log(
        chalk.cyan(`API Docs: http://localhost:${config.server.port}/api-docs`)
      );
      console.log(
        chalk.cyan(
          `Health Check: http://localhost:${config.server.port}/health\n`
        )
      );
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(
        chalk.yellow(`\n${signal} received. Starting graceful shutdown...`)
      );

      server.close(async () => {
        console.log(chalk.yellow("HTTP server closed"));

        // Shutdown queue workers
        await shutdownWorkers();
        console.log(chalk.yellow("Queue workers shut down"));

        // Disconnect from database
        await disconnectDatabase();
        console.log(chalk.yellow("Database disconnected"));

        console.log(chalk.green("Graceful shutdown completed"));
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error(chalk.red("Forced shutdown after timeout"));
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error(chalk.red("Failed to start server:"), error);
    process.exit(1);
  }
};

// Start the server
startServer();
