import { MESSAGES } from "../../common/constants/messages.constant";
import { ApiError } from "../../common/errors/api-error";
import { ERROR_CODES } from "../../common/errors/error-codes";
import { hashPassword } from "../../common/utils/hash.util";
import {
  createPaginatedResponse,
  getPrismaSkip,
  parsePaginationParams,
} from "../../common/utils/pagination.util";
import { prisma } from "../../config/database.config";
import { emailService } from "../email/email.service";
import { IUsersService } from "./users.types";
import { GetUsersQuery, UpdateUserBody } from "./users.validation";

export class UsersService implements IUsersService {
  // Get all users (paginated)
  async getUsers(query: GetUsersQuery) {
    const { page, limit, sortBy, sortOrder } = parsePaginationParams(query);

    const where: any = {};

    if ((query as any).search) {
      where.OR = [
        { name: { contains: (query as any).search, mode: "insensitive" } },
        { email: { contains: (query as any).search, mode: "insensitive" } },
      ];
    }

    if (query.role) {
      where.role = query.role;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: getPrismaSkip(page, limit),
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          image: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          subscription: {
            include: {
              plan: true,
            },
          },
          creditWallet: {
            select: {
              balance: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return createPaginatedResponse(users, total, page, limit);
  }

  // Get user by ID
  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        image: true,
        isActive: true,
        creditWallet: true,
        createdAt: true,
        updatedAt: true,
        subscription: {
          include: {
            plan: true,
          },
        },
        _count: {
          select: {
            stores: true,
            ads: true,
            templates: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.notFound(
        MESSAGES.USERS.NOT_FOUND,
        ERROR_CODES.USER_NOT_FOUND,
      );
    }

    return user;
  }

  // Update user
  async updateUser(id: string, data: UpdateUserBody) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
      throw ApiError.notFound(
        MESSAGES.USERS.NOT_FOUND,
        ERROR_CODES.USER_NOT_FOUND,
      );
    }

    // Check email uniqueness if email is being updated
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        throw ApiError.conflict(
          MESSAGES.AUTH.EMAIL_ALREADY_EXISTS,
          ERROR_CODES.EMAIL_ALREADY_EXISTS,
        );
      }
    }

    // Hash password if provided
    const updateData: Record<string, unknown> = { ...data };
    if (data.password) {
      updateData.password = await hashPassword(data.password);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData as any,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  // Delete user
  async deleteUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw ApiError.notFound(
        MESSAGES.USERS.NOT_FOUND,
        ERROR_CODES.USER_NOT_FOUND,
      );
    }

    await prisma.user.delete({ where: { id } });
  }

  // Create user (Admin only)
  async createUser(data: any) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw ApiError.conflict(
        MESSAGES.AUTH.EMAIL_ALREADY_EXISTS,
        ERROR_CODES.EMAIL_ALREADY_EXISTS,
      );
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        emailVerified: new Date(), // Admin created users are verified by default
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Send invitation email asynchronously
    emailService
      .sendInvitationEmail(user.email, user.name || "User", data.password)
      .catch((err) =>
        console.error(
          `[UsersService] Failed to send invite to ${user.email}:`,
          err.message,
        ),
      );

    return user;
  }

  // Admin Change Password
  async adminChangePassword(id: string, password: string) {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw ApiError.notFound(
        MESSAGES.USERS.NOT_FOUND,
        ERROR_CODES.USER_NOT_FOUND,
      );
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  // Get current user profile
  async getProfile(userId: string) {
    return this.getUserById(userId);
  }

  // Update current user profile
  async updateProfile(userId: string, data: Partial<UpdateUserBody>) {
    // Users can't update their own role
    const { role, ...profileData } = data as any;

    // Map frontend 'avatar' to backend 'image' if present
    if (profileData.avatar !== undefined) {
      profileData.image = profileData.avatar;
      delete profileData.avatar;
    }

    return this.updateUser(userId, profileData);
  }

  // Update user role
  async updateUserRole(id: string, role: string) {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw ApiError.notFound(
        MESSAGES.USERS.NOT_FOUND,
        ERROR_CODES.USER_NOT_FOUND,
      );
    }

    return prisma.user.update({
      where: { id },
      data: { role: role as any },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}

export const usersService = new UsersService();
