// Common types used across the application

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends TokenResponse {
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
  };
}

export type SortOrder = "asc" | "desc";

export interface QueryFilter {
  [key: string]: any;
}
