import { NextFunction, Request, Response } from "express";
import { MESSAGES } from "../../common/constants/messages.constant";
import { sendPaginated, sendSuccess } from "../../common/utils/response.util";
import { usersService } from "./users.service";

export class UsersController {
  // Get all users (Admin only) --- GET /users
  async getUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await usersService.getUsers(req.query as any);
      sendPaginated(res, MESSAGES.USERS.FETCHED, result);
    } catch (error) {
      next(error);
    }
  }

  // Get user by ID --- GET /users/:id
  async getUserById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await usersService.getUserById(req.params.id);
      sendSuccess(res, MESSAGES.USERS.FETCHED_ONE, user);
    } catch (error) {
      next(error);
    }
  }

  // Update user (Admin only) --- PUT /users/:id
  async updateUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await usersService.updateUser(req.params.id, req.body);
      sendSuccess(res, MESSAGES.USERS.UPDATED, user);
    } catch (error) {
      next(error);
    }
  }

  // Delete user (Admin only) --- DELETE /users/:id
  async deleteUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await usersService.deleteUser(req.params.id);
      sendSuccess(res, MESSAGES.USERS.DELETED);
    } catch (error) {
      next(error);
    }
  }

  // Get current user profile --- GET /users/profile
  async getProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await usersService.getProfile(req.user!.id);
      sendSuccess(res, MESSAGES.USERS.FETCHED_ONE, user);
    } catch (error) {
      next(error);
    }
  }

  // Update current user profile --- PUT /users/profile
  async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await usersService.updateProfile(req.user!.id, req.body);
      sendSuccess(res, MESSAGES.USERS.UPDATED, user);
    } catch (error) {
      next(error);
    }
  }

  // Update user role (Admin only) --- PUT /users/:id/role
  async updateUserRole(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const user = await usersService.updateUserRole(id, role);
      sendSuccess(res, MESSAGES.USERS.UPDATED, user);
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
