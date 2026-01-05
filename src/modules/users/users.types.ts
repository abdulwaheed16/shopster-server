import { PaginatedResponse } from "../../common/utils/pagination.util";
import { GetUsersQuery, UpdateUserBody } from "./users.validation";

export interface IUsersService {
  getUsers(query: GetUsersQuery): Promise<PaginatedResponse<unknown>>;
  getUserById(id: string): Promise<unknown>;
  updateUser(id: string, data: UpdateUserBody): Promise<unknown>;
  deleteUser(id: string): Promise<void>;
  getProfile(userId: string): Promise<unknown>;
  updateProfile(
    userId: string,
    data: Partial<UpdateUserBody>
  ): Promise<unknown>;
  updateUserRole(id: string, role: string): Promise<unknown>;
}
