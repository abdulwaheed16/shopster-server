import { User } from "@prisma/client";
import crypto from "crypto";
import { MESSAGES } from "../../common/constants/messages.constant";
import { UserRole } from "../../common/constants/roles.constant";
import { ApiError } from "../../common/errors/api-error";
import { ERROR_CODES } from "../../common/errors/error-codes";
import { emailTemplates } from "../../common/utils/email.util";
import { comparePassword, hashPassword } from "../../common/utils/hash.util";
import {
  generateTokens,
  verifyRefreshToken,
} from "../../common/utils/jwt.util";
import { prisma } from "../../config/database.config";
import { IAuthService } from "./auth.types";
import {
  ChangePasswordBody,
  LoginBody,
  RefreshTokenBody,
  RegisterBody,
  RequestPasswordResetBody,
  ResetPasswordBody,
  VerifyEmailBody,
} from "./auth.validation";

export class AuthService implements IAuthService {
  // Change password for logged-in users
  async changePassword(userId: string, data: ChangePasswordBody) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      throw ApiError.unauthorized(MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    // Verify current (old) password
    const isPasswordValid = await comparePassword(
      data.currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      throw ApiError.badRequest(MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    // Hash new password
    const hashedPassword = await hashPassword(data.newPassword);

    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  // Register new user
  async register(data: RegisterBody) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser && existingUser.emailVerified) {
      throw ApiError.conflict(
        MESSAGES.AUTH.EMAIL_ALREADY_EXISTS,
        ERROR_CODES.EMAIL_ALREADY_EXISTS
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);
    let user: User;

    if (existingUser && !existingUser.emailVerified) {
      // Update existing unverified user with new registration info
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
          name: data.name,
        },
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          role: UserRole.USER,
        },
      });
    }

    // Delete any existing verification tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: user.email,
        type: "EMAIL_VERIFICATION",
      },
    });

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: verificationToken,
        type: "EMAIL_VERIFICATION",
        expires: expiresAt,
      },
    });

    // Send verification email
    await emailTemplates.sendVerificationEmail(
      user.email,
      verificationToken,
      user.name || "User"
    );

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      tokens,
    };
  }

  // Login user
  async login(data: LoginBody) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.password) {
      throw ApiError.unauthorized(MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    // Verify password
    const isPasswordValid = await comparePassword(data.password, user.password);

    if (!isPasswordValid) {
      throw ApiError.unauthorized(MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    // Check if email is verified
    // if (!user.emailVerified) {
    //   throw ApiError.unauthorized(
    //     MESSAGES.AUTH.EMAIL_NOT_VERIFIED,
    //     ERROR_CODES.EMAIL_NOT_VERIFIED
    //   );
    // }

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      tokens,
    };
  }

  // Refresh access token
  async refreshToken(data: RefreshTokenBody) {
    // Verify refresh token
    const decoded = verifyRefreshToken(data.refreshToken);

    if (!decoded) {
      throw ApiError.unauthorized(MESSAGES.AUTH.INVALID_TOKEN);
    }

    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: (decoded as any).userId },
    });

    if (!user) {
      throw ApiError.unauthorized(MESSAGES.AUTH.INVALID_TOKEN);
    }

    // Generate new access token
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // Verify email
  async verifyEmail(data: VerifyEmailBody) {
    // Find verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: data.token },
    });

    if (!verificationToken || verificationToken.type !== "EMAIL_VERIFICATION") {
      // Check if user is already verified
      const user = await prisma.user.findFirst({
        where: {
          emailVerified: { not: null },
          // We don't have the identifier here if token is missing
        },
      });
      // Better strategy: if token is missing, we can't know the user,
      // but if the user *knows* they verified, we can at least suggest they check login.
      throw ApiError.badRequest(MESSAGES.AUTH.INVALID_TOKEN);
    }

    // Check if token is expired
    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      });
      throw ApiError.badRequest(MESSAGES.AUTH.INVALID_TOKEN);
    }

    // Update user
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    // Delete verification token
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });
  }

  // Request password reset
  async requestPasswordReset(data: RequestPasswordResetBody) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    // Don't reveal if user exists or not
    if (!user) {
      return;
    }

    // Delete any existing password reset tokens
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: user.email,
        type: "PASSWORD_RESET",
      },
    });

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: resetToken,
        type: "PASSWORD_RESET",
        expires: expiresAt,
      },
    });

    // Send reset email
    await emailTemplates.sendPasswordResetEmail(
      user.email,
      resetToken,
      user.name || "User"
    );
  }

  // Reset password
  async resetPassword(data: ResetPasswordBody) {
    // Find reset token
    const resetToken = await prisma.verificationToken.findUnique({
      where: { token: data.token },
    });

    if (!resetToken || resetToken.type !== "PASSWORD_RESET") {
      throw ApiError.badRequest(MESSAGES.AUTH.INVALID_TOKEN);
    }

    // Check if token is expired
    if (resetToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { id: resetToken.id },
      });
      throw ApiError.badRequest(MESSAGES.AUTH.INVALID_TOKEN);
    }

    // Hash new password
    const hashedPassword = await hashPassword(data.password);

    // Update user password
    await prisma.user.update({
      where: { email: resetToken.identifier },
      data: { password: hashedPassword },
    });

    // Delete reset token
    await prisma.verificationToken.delete({
      where: { id: resetToken.id },
    });
  }
}

export const authService = new AuthService();
