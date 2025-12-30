import { ApiError } from "../../common/errors/api-error";
import { comparePassword, hashPassword } from "../../common/utils/hash.util";
import { prisma } from "../../config/database.config";
import { usersService } from "../users/users.service";
import { UpdateProfileInput, UpdateSecurityInput } from "./settings.validation";

export class SettingsService {
  /**
   * Get user profile settings
   */
  async getProfile(userId: string) {
    return usersService.getProfile(userId);
  }

  /**
   * Update user profile settings
   */
  async updateProfile(userId: string, data: UpdateProfileInput) {
    return usersService.updateProfile(userId, data);
  }

  /**
   * Get security settings
   */
  async getSecuritySettings(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      twoFactorEnabled: user?.twoFactorEnabled || false,
      lastPasswordChange: user?.updatedAt, // Simplified
    };
  }

  /**
   * Update security (password change)
   */
  async updateSecurity(userId: string, data: UpdateSecurityInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      throw ApiError.unauthorized("User not found or password not set");
    }

    const isPasswordMatch = await comparePassword(
      data.currentPassword,
      user.password
    );
    if (!isPasswordMatch) {
      throw ApiError.badRequest("Incorrect current password");
    }

    const hashedPassword = await hashPassword(data.newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: "Password updated successfully" };
  }

  /**
   * Toggle 2FA (Placeholder)
   */
  async toggle2FA(userId: string, enabled: boolean) {
    // Placeholder logic - in real world would require TOTP verification
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: enabled },
    });

    return {
      message: `2FA ${enabled ? "enabled" : "disabled"} successfully (Mock)`,
      enabled,
    };
  }
}

export const settingsService = new SettingsService();
