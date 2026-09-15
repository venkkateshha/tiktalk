/**
 * TikTalk Service Boundary: Baseline Authentication Service
 * Clean boundary managing sessions and integrating with secure token storage
 */

import { IAuthService, AuthStateListener } from './IAuthService';
import { AuthSessionData, AuthCredentials } from '../../domain/auth';
import { User } from '../../domain/user';
import { tokenStorage } from '../../core/security/secureStorage';
import { IApiClient, apiClient } from '../api';

export class AuthService implements IAuthService {
  private currentSession: AuthSessionData | null = null;
  private listeners: Set<AuthStateListener> = new Set();
  private client: IApiClient;

  constructor(client: IApiClient = apiClient) {
    this.client = client;
  }

  async getSession(): Promise<AuthSessionData | null> {
    return this.currentSession;
  }

  async getCurrentUser(): Promise<User | null> {
    return this.currentSession?.user || null;
  }

  async login(credentials: AuthCredentials): Promise<AuthSessionData> {
    // In Phase 1, prepare boundary contract
    const res = await this.client.post<AuthSessionData>('/auth/login', credentials);
    this.currentSession = res.data;
    await tokenStorage.setAccessToken(res.data.tokens.accessToken);
    if (res.data.tokens.refreshToken) {
      await tokenStorage.setRefreshToken(res.data.tokens.refreshToken);
    }
    this.notifyListeners();
    return res.data;
  }

  async register(
    credentials: AuthCredentials & { username: string; displayName: string }
  ): Promise<AuthSessionData> {
    const res = await this.client.post<AuthSessionData>('/auth/register', credentials);
    this.currentSession = res.data;
    await tokenStorage.setAccessToken(res.data.tokens.accessToken);
    if (res.data.tokens.refreshToken) {
      await tokenStorage.setRefreshToken(res.data.tokens.refreshToken);
    }
    this.notifyListeners();
    return res.data;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } catch {
      // Clean up local session regardless of server state
    }
    this.currentSession = null;
    await tokenStorage.clearTokens();
    this.notifyListeners();
  }

  async refreshToken(): Promise<string | null> {
    const currentRefresh = await tokenStorage.getRefreshToken();
    if (!currentRefresh) return null;

    try {
      const res = await this.client.post<{ accessToken: string }>('/auth/refresh', {
        refreshToken: currentRefresh,
      });
      await tokenStorage.setAccessToken(res.data.accessToken);
      return res.data.accessToken;
    } catch {
      await this.logout();
      return null;
    }
  }

  subscribeToAuthState(listener: AuthStateListener): () => void {
    this.listeners.add(listener);
    listener(this.currentSession);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.currentSession);
    }
  }
}

export const authService: IAuthService = new AuthService();
