export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

export const ROLES = {
  USER: UserRole.USER,
  ADMIN: UserRole.ADMIN,
} as const;

export const ROLE_HIERARCHY = {
  [UserRole.ADMIN]: 2,
  [UserRole.USER]: 1,
} as const;
