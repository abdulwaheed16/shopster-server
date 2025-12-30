import rateLimit from "express-rate-limit";
import { config } from "../../config/env.config";
import { ApiError } from "../errors/api-error";

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw ApiError.tooManyRequests("Too many requests, please try again later");
  },
});

// Strict limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: "Too many authentication attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    throw ApiError.tooManyRequests(
      "Too many authentication attempts, please try again later"
    );
  },
});

// Limiter for ad generation (resource-intensive)
export const adGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 ad generations per hour
  message: "Ad generation limit reached, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw ApiError.tooManyRequests(
      "Ad generation limit reached, please try again later"
    );
  },
});
