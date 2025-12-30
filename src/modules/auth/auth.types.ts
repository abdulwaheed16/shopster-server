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
