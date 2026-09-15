/**
 * TikTalk Domain: Authentication & Session
 */

import { UserRole } from '../core/security/types';
import { User } from './user';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresInSeconds: number;
}

export interface AuthSessionData {
  user: User;
  roles: UserRole[];
  tokens: AuthTokens;
}

export interface AuthCredentials {
  identifier: string; // phone or email
  password?: string;
  otpCode?: string;
}
