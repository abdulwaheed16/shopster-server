import { MESSAGES } from "../../common/constants/messages.constant";
import { ApiError } from "../../common/errors/api-error";
import { ERROR_CODES } from "../../common/errors/error-codes";
import { hashPassword } from "../../common/utils/hash.util";
import {
  createPaginatedResponse,
  getPrismaSkip,
  PaginatedResponse,
  parsePaginationParams,
} from "../../common/utils/pagination.util";
import { prisma } from "../../config/database.config";
import { UpdateUserInput } from "./users.validation";

export class UsersService {
  // Get all users (paginated)
  async getUsers(query: any): Promise<PaginatedResponse<any>> {
    const { page, limit, sortBy, sortOrder } = parsePaginationParams(query);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
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
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count(),
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
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            stores: true,
            ads: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.notFound(
        MESSAGES.USERS.NOT_FOUND,
        ERROR_CODES.USER_NOT_FOUND
      );
    }

    return user;
  }

  // Update user
  async updateUser(id: string, data: UpdateUserInput["body"]) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
      throw ApiError.notFound(
        MESSAGES.USERS.NOT_FOUND,
        ERROR_CODES.USER_NOT_FOUND
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
          ERROR_CODES.EMAIL_ALREADY_EXISTS
        );
      }
    }

    // Hash password if provided
    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = await hashPassword(data.password);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
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
  async deleteUser(id: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw ApiError.notFound(
        MESSAGES.USERS.NOT_FOUND,
        ERROR_CODES.USER_NOT_FOUND
      );
    }

    await prisma.user.delete({ where: { id } });
  }

  // Get current user profile
  async getProfile(userId: string) {
    return this.getUserById(userId);
  }

  // Update current user profile
  async updateProfile(userId: string, data: Partial<UpdateUserInput["body"]>) {
    // Users can't update their own role
    const { role, ...profileData } = data;
    return this.updateUser(userId, profileData);
  }

  // Update user role
  async updateUserRole(id: string, role: string) {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw ApiError.notFound(
        MESSAGES.USERS.NOT_FOUND,
        ERROR_CODES.USER_NOT_FOUND
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
