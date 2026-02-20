export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
  GUEST = "GUEST",
}

export const ROLES = {
  USER: UserRole.USER,
  ADMIN: UserRole.ADMIN,
  GUEST: UserRole.GUEST,
} as const;

export const ROLE_HIERARCHY = {
  [UserRole.ADMIN]: 2,
  [UserRole.USER]: 1,
  [UserRole.GUEST]: 0,
} as const;
