import chalk from "chalk";
import {
  handleUncaughtException,
  handleUnhandledRejection,
} from "./common/errors/error-handler";
import {
  disconnectDatabase,
  testDatabaseConnection,
} from "./config/database.config";
import { initializeWorkers, shutdownWorkers } from "./queues";

// Handle uncaught exceptions
process.on("uncaughtException", handleUncaughtException);

// Handle unhandled promise rejections
process.on("unhandledRejection", handleUnhandledRejection);

const startWorker = async () => {
  try {
    console.log(chalk.blue.bold("Starting Background Worker Process..."));

    // Test database connection
    const isDbConnected = await testDatabaseConnection();

    if (!isDbConnected) {
      console.error(chalk.red("Failed to connect to database. Exiting..."));
      process.exit(1);
    }

    // Initialize queue workers
    initializeWorkers();

    console.log(
      chalk.green.bold("Worker Process is running and listening for jobs!")
    );

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(
        chalk.yellow(
          `\n${signal} received. Starting graceful shutdown of Worker...`
        )
      );

      // Shutdown queue workers
      await shutdownWorkers();
      console.log(chalk.yellow("Queue workers shut down"));

      // Disconnect from database
      await disconnectDatabase();
      console.log(chalk.yellow("Database disconnected"));

      console.log(chalk.green("Graceful shutdown completed"));
      process.exit(0);
    };

    // Listen for termination signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error(chalk.red("Failed to start worker:"), error);
    process.exit(1);
  }
};

// Start the worker
startWorker();
