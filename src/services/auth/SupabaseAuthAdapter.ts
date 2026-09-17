/**
 * TikTalk Service: SupabaseAuthAdapter
 * Production implementation of IAuthService backed by Supabase Auth (GoTrue).
 * Adheres strictly to the existing IAuthService contract, tokenStorage, and user domains.
 * Provides deterministic offline/fallback behavior when unconfigured.
 */

import { IAuthService, AuthStateListener } from './IAuthService';
import { AuthSessionData, AuthCredentials } from '../../domain/auth';
import { User } from '../../domain/user';
import { tokenStorage } from '../../core/security/secureStorage';
import { getSupabaseClient, isSupabaseConfigured } from '../../core/supabase';
import { authService as localFallbackAuthService } from './AuthService';

export class SupabaseAuthAdapter implements IAuthService {
  private listeners: Set<AuthStateListener> = new Set();
  private authStateSubscription: { unsubscribe: () => void } | null = null;

  constructor() {
    this.setupAuthChangeListener();
  }

  private setupAuthChangeListener(): void {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const mappedSession = session ? this.mapSupabaseSession(session) : null;
      if (mappedSession) {
        await tokenStorage.setAccessToken(mappedSession.tokens.accessToken);
        if (mappedSession.tokens.refreshToken) {
          await tokenStorage.setRefreshToken(mappedSession.tokens.refreshToken);
        }
      } else {
        await tokenStorage.clearTokens();
      }
      this.notifyListeners(mappedSession);
    });

    this.authStateSubscription = data.subscription;
  }

  private mapSupabaseSession(session: any): AuthSessionData {
    const sbUser = session.user;
    const metadata = sbUser?.user_metadata || {};

    const user: User = {
      id: sbUser?.id || 'unknown',
      username: metadata.username || sbUser?.email?.split('@')[0] || 'user',
      displayName: metadata.displayName || metadata.username || 'TikTalk User',
      avatarUrl: metadata.avatarUrl || undefined,
      bio: metadata.bio || undefined,
      verificationStatus: metadata.verificationStatus || 'none',
      isCreator: Boolean(metadata.isCreator),
      createdAt: sbUser?.created_at || new Date().toISOString(),
    };

    return {
      user,
      roles: metadata.roles || ['viewer'],
      tokens: {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresInSeconds: session.expires_in || 3600,
      },
    };
  }

  async getSession(): Promise<AuthSessionData | null> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return localFallbackAuthService.getSession();
    }

    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      return null;
    }

    return this.mapSupabaseSession(data.session);
  }

  async getCurrentUser(): Promise<User | null> {
    const session = await this.getSession();
    return session?.user || null;
  }

  async login(credentials: AuthCredentials): Promise<AuthSessionData> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return localFallbackAuthService.login(credentials);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.identifier,
      password: credentials.password || '',
    });

    if (error || !data.session) {
      throw new Error(error?.message || 'Login failed');
    }

    const mapped = this.mapSupabaseSession(data.session);
    await tokenStorage.setAccessToken(mapped.tokens.accessToken);
    if (mapped.tokens.refreshToken) {
      await tokenStorage.setRefreshToken(mapped.tokens.refreshToken);
    }

    this.notifyListeners(mapped);
    return mapped;
  }

  async register(
    credentials: AuthCredentials & { username: string; displayName: string }
  ): Promise<AuthSessionData> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return localFallbackAuthService.register(credentials);
    }

    const { data, error } = await supabase.auth.signUp({
      email: credentials.identifier,
      password: credentials.password || '',
      options: {
        data: {
          username: credentials.username,
          displayName: credentials.displayName,
          verificationStatus: 'none',
          isCreator: false,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.session) {
      // If email confirmation is enabled, synthesize pending session or return unconfirmed
      const user: User = {
        id: data.user?.id || 'pending',
        username: credentials.username,
        displayName: credentials.displayName,
        verificationStatus: 'none',
        isCreator: false,
        createdAt: new Date().toISOString(),
      };
      return {
        user,
        roles: ['viewer'],
        tokens: {
          accessToken: 'pending_confirmation',
          expiresInSeconds: 0,
        },
      };
    }

    const mapped = this.mapSupabaseSession(data.session);
    await tokenStorage.setAccessToken(mapped.tokens.accessToken);
    if (mapped.tokens.refreshToken) {
      await tokenStorage.setRefreshToken(mapped.tokens.refreshToken);
    }

    this.notifyListeners(mapped);
    return mapped;
  }

  async logout(): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return localFallbackAuthService.logout();
    }

    try {
      await supabase.auth.signOut();
    } catch {
      // Clean up locally regardless of server state
    }

    await tokenStorage.clearTokens();
    this.notifyListeners(null);
  }

  async refreshToken(): Promise<string | null> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return localFallbackAuthService.refreshToken();
    }

    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) {
      await this.logout();
      return null;
    }

    await tokenStorage.setAccessToken(data.session.access_token);
    return data.session.access_token;
  }

  subscribeToAuthState(listener: AuthStateListener): () => void {
    this.listeners.add(listener);

    // Initial delivery
    this.getSession().then((session) => {
      listener(session);
    });

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(session: AuthSessionData | null): void {
    for (const listener of this.listeners) {
      try {
        listener(session);
      } catch (err) {
        console.error('[SupabaseAuthAdapter] Listener error:', err);
      }
    }
  }

  destroy(): void {
    if (this.authStateSubscription) {
      this.authStateSubscription.unsubscribe();
      this.authStateSubscription = null;
    }
    this.listeners.clear();
  }
}

export const supabaseAuthAdapter: IAuthService = new SupabaseAuthAdapter();
