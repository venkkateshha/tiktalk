/**
 * TikTalk Security Foundation
 * Role-Based Access Control (RBAC), Session Tokens, and Security Guardrails
 */

export type UserRole =
  | 'viewer'
  | 'creator'
  | 'verified_creator'
  | 'business'
  | 'moderator'
  | 'admin'
  | 'super_admin';

export interface AuthSession {
  userId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  roles: UserRole[];
}

export interface ITokenStorage {
  getAccessToken(): Promise<string | null>;
  setAccessToken(token: string): Promise<void>;
  getRefreshToken(): Promise<string | null>;
  setRefreshToken(token: string): Promise<void>;
  clearTokens(): Promise<void>;
}

export interface SecurityPolicy {
  minPasswordLength: number;
  sessionTimeoutMinutes: number;
  mfaRequiredForRoles: UserRole[];
}
