import { config } from "./env.config";

export const jwtConfig = {
  access: {
    secret: config.jwt.accessSecret,
    expiresIn: config.jwt.accessExpiry,
  },
  refresh: {
    secret: config.jwt.refreshSecret,
    expiresIn: config.jwt.refreshExpiry,
  },
  cookie: {
    httpOnly: true,
    secure: config.server.isProduction,
    sameSite: "strict" as const,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  },
} as const;
