export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  emailVerified: Date | null;
}

export interface AuthResponse {
  user: AuthUser;
  tokens?: AuthTokens;
}

import {
  ChangePasswordBody,
  LoginBody,
  RefreshTokenBody,
  RegisterBody,
  RequestPasswordResetBody,
  ResetPasswordBody,
  VerifyEmailBody,
} from "./auth.validation";

export interface IAuthService {
  changePassword(userId: string, data: ChangePasswordBody): Promise<void>;
  register(data: RegisterBody): Promise<AuthResponse>;
  login(data: LoginBody): Promise<AuthResponse>;
  refreshToken(data: RefreshTokenBody): Promise<{ accessToken: string }>;
  verifyEmail(data: VerifyEmailBody): Promise<void>;
  requestPasswordReset(data: RequestPasswordResetBody): Promise<void>;
  resetPassword(data: ResetPasswordBody): Promise<void>;
}
