/**
 * TikTalk Service Boundary: Authentication Service Contract
 */

import { AuthSessionData, AuthCredentials } from '../../domain/auth';
import { User } from '../../domain/user';

export type AuthStateListener = (session: AuthSessionData | null) => void;

export interface IAuthService {
  getSession(): Promise<AuthSessionData | null>;
  login(credentials: AuthCredentials): Promise<AuthSessionData>;
  register(credentials: AuthCredentials & { username: string; displayName: string }): Promise<AuthSessionData>;
  logout(): Promise<void>;
  refreshToken(): Promise<string | null>;
  getCurrentUser(): Promise<User | null>;
  subscribeToAuthState(listener: AuthStateListener): () => void;
}
