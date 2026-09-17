/**
 * TikTalk Development Authentication Bridge
 * Provides deterministic session restoration and development-account bootstrap
 * for Android emulators and development environments without exposing credentials.
 * Strictly adheres to ZERO FAKE DATA — authenticates real Supabase Auth accounts only.
 */

import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseAuthAdapter } from '../../services/auth/SupabaseAuthAdapter';
import { isSupabaseConfigured } from '../supabase';
import { Config } from '../config/environment';
import { AuthSessionData } from '../../domain/auth';

const STORAGE_KEY_DEV_ROLE = '@tiktalk_dev_client_role';

export async function bootstrapAuthSession(): Promise<AuthSessionData | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    // 1. Check for existing persistent session
    const existingSession = await supabaseAuthAdapter.getSession();
    if (existingSession?.user && existingSession.user.id !== 'unknown') {
      console.log('[DevAuthBridge] Restored existing persistent session:', {
        sanitizedUserId: existingSession.user.id.slice(0, 8),
        username: existingSession.user.username,
      });
      return existingSession;
    }

    // 2. If in development, check for assigned development role
    if (Config.isDevelopment) {
      let role = await AsyncStorage.getItem(STORAGE_KEY_DEV_ROLE);

      // Check deep link / intent URL or web search params if not set
      if (!role) {
        if (typeof window !== 'undefined' && window.location?.search) {
          const search = window.location.search;
          if (search.includes('role=caller') || search.includes('user=caller')) {
            role = 'caller';
          } else if (search.includes('role=callee') || search.includes('user=callee')) {
            role = 'callee';
          }
        }
        if (!role) {
          try {
            const initialUrl = await Linking.getInitialURL();
            if (initialUrl) {
              if (initialUrl.includes('role=caller') || initialUrl.includes('user=caller')) {
                role = 'caller';
              } else if (initialUrl.includes('role=callee') || initialUrl.includes('user=callee')) {
                role = 'callee';
              }
            }
          } catch {
            // Ignore linking error
          }
        }
      }

      // If role found, persist and authenticate with environment credentials
      if (role === 'caller' || role === 'callee') {
        await AsyncStorage.setItem(STORAGE_KEY_DEV_ROLE, role);

        const email =
          role === 'caller'
            ? process.env.EXPO_PUBLIC_DEV_CALLER_EMAIL
            : process.env.EXPO_PUBLIC_DEV_CALLEE_EMAIL;
        const password =
          role === 'caller'
            ? process.env.EXPO_PUBLIC_DEV_CALLER_PASSWORD
            : process.env.EXPO_PUBLIC_DEV_CALLEE_PASSWORD;

        if (email && password) {
          const session = await supabaseAuthAdapter.login({
            identifier: email,
            password,
          });
          console.log('[DevAuthBridge] Authenticated development role:', {
            role,
            sanitizedUserId: session?.user?.id?.slice(0, 8),
            hasSession: !!session,
          });
          return session;
        }
      }
    }
  } catch (err: any) {
    console.warn('[DevAuthBridge] Bootstrap error:', err?.message || 'unknown');
  }

  return null;
}

export async function getDevelopmentRole(): Promise<'caller' | 'callee' | null> {
  try {
    const role = await AsyncStorage.getItem(STORAGE_KEY_DEV_ROLE);
    if (role === 'caller' || role === 'callee') {
      return role;
    }
  } catch {
    // Ignore storage read error
  }
  return null;
}

export async function setDevelopmentRole(role: 'caller' | 'callee'): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_DEV_ROLE, role);
}

export async function loginWithDevelopmentRole(role: 'caller' | 'callee'): Promise<AuthSessionData | null> {
  await setDevelopmentRole(role);
  const email =
    role === 'caller'
      ? process.env.EXPO_PUBLIC_DEV_CALLER_EMAIL
      : process.env.EXPO_PUBLIC_DEV_CALLEE_EMAIL;
  const password =
    role === 'caller'
      ? process.env.EXPO_PUBLIC_DEV_CALLER_PASSWORD
      : process.env.EXPO_PUBLIC_DEV_CALLEE_PASSWORD;

  if (email && password) {
    return await supabaseAuthAdapter.login({
      identifier: email,
      password,
    });
  }
  return null;
}

// Setup runtime deep link listener for dynamic role switches
if (Config.isDevelopment && typeof Linking !== 'undefined' && Linking.addEventListener) {
  try {
    Linking.addEventListener('url', (event) => {
      if (!event?.url) return;
      if (event.url.includes('role=caller') || event.url.includes('user=caller')) {
        loginWithDevelopmentRole('caller').catch(() => {});
      } else if (event.url.includes('role=callee') || event.url.includes('user=callee')) {
        loginWithDevelopmentRole('callee').catch(() => {});
      }
    });
  } catch {
    // Ignore linking listener setup error in headless / node environments
  }
}

