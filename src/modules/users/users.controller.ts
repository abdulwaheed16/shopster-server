import { NextFunction, Request, Response } from "express";
import { MESSAGES } from "../../common/constants/messages.constant";
import { sendPaginated, sendSuccess } from "../../common/utils/response.util";
import { usersService } from "./users.service";

export class UsersController {
  async getUsers(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await usersService.getUsers(req.query as any);
      sendPaginated(res, MESSAGES.USERS.FETCHED, result);
    } catch (error) {
      next(error);
    }
  }

  async getUserById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await usersService.getUserById(req.params.id as string);
      sendSuccess(res, MESSAGES.USERS.FETCHED_ONE, user);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await usersService.updateUser(
        req.params.id as string,
        req.body,
      );
      sendSuccess(res, MESSAGES.USERS.UPDATED, user);
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await usersService.deleteUser(req.params.id as string);
      sendSuccess(res, MESSAGES.USERS.DELETED);
    } catch (error) {
      next(error);
    }
  }

  async getProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await usersService.getProfile(req.user!.id);
      sendSuccess(res, MESSAGES.USERS.FETCHED_ONE, user);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await usersService.updateProfile(req.user!.id, req.body);
      sendSuccess(res, MESSAGES.USERS.UPDATED, user);
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const user = await usersService.updateUserRole(id as string, role);
      sendSuccess(res, MESSAGES.USERS.UPDATED, user);
    } catch (error) {
      next(error);
    }
  }

  async createUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await usersService.createUser(req.body);
      sendSuccess(res, MESSAGES.USERS.CREATED, user);
    } catch (error) {
      next(error);
    }
  }

  async adminChangePassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { password } = req.body;
      await usersService.adminChangePassword(id as string, password);
      sendSuccess(res, MESSAGES.USERS.UPDATED);
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
