import jwt from "jsonwebtoken";
import { jwtConfig } from "../../config/jwt.config";
import { UserRole } from "../constants/roles.constant";

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AccessTokenPayload extends JwtPayload {
  type: "access";
}

export interface RefreshTokenPayload extends JwtPayload {
  type: "refresh";
}

// Generate access token
export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(
    { ...payload, type: "access" } as AccessTokenPayload,
    jwtConfig.access.secret,
    {
      expiresIn: jwtConfig.access.expiresIn as unknown as number,
      algorithm: "HS256",
    }
  );
};

// Generate refresh token
export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(
    { ...payload, type: "refresh" } as RefreshTokenPayload,
    jwtConfig.refresh.secret,
    {
      expiresIn: jwtConfig.refresh.expiresIn as unknown as number,
      algorithm: "HS256",
    }
  );
};

// Verify access token
export const verifyAccessToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(
      token,
      jwtConfig.access.secret
    ) as AccessTokenPayload;

    if (decoded.type !== "access") {
      return null;
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
    return null;
  }
};

// Verify refresh token
export const verifyRefreshToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(
      token,
      jwtConfig.refresh.secret
    ) as RefreshTokenPayload;

    if (decoded.type !== "refresh") {
      return null;
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
    return null;
  }
};

// Generate both tokens
export const generateTokens = (payload: JwtPayload) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};
