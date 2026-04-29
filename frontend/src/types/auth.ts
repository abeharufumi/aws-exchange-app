export interface AuthUser {
  id: number;
  email: string;
  gender: string;
  displayName: string;
  avatarUrl?: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: "bearer" | string;
  user: AuthUser;
}

export interface AuthErrorResponse {
  detail?: string;
  message?: string;
}

export interface AuthLogoutResponse {
  status: "ok" | string;
}
