import winston from "winston";
import { config } from "./env.config";

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

// Tell winston about our colors
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.printf((info) => {
    const stack = info.stack ? `\n${info.stack}` : "";
    return `${info.timestamp} ${info.level}: ${info.message}${stack}`;
  }),
);

// Define which transports to use
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format: config.server.isDevelopment ? consoleFormat : format,
  }),
];

// Add file transports in production
if (!config.server.isDevelopment) {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format,
    }),
    // Combined log file
    new winston.transports.File({
      filename: "logs/combined.log",
      format,
    }),
  );
}

// Create the logger
export const logger = winston.createLogger({
  level: config.server.isDevelopment ? "debug" : "info",
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logger
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper functions for structured logging
export const logError = (
  message: string,
  error?: Error | unknown,
  meta?: Record<string, any>,
) => {
  logger.error(message, {
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
    ...meta,
  });
};

export const logInfo = (message: string, meta?: Record<string, any>) => {
  logger.info(message, meta);
};

export const logWarn = (message: string, meta?: Record<string, any>) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: Record<string, any>) => {
  logger.debug(message, meta);
};

export const logHttp = (message: string, meta?: Record<string, any>) => {
  logger.http(message, meta);
};
