/**
 * TikTalk Infrastructure: Supabase Client Foundation
 * Singleton Supabase client with explicit environment validation,
 * zero service-role exposure, and graceful fallback when unconfigured.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../config/environment';

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseAuthStorage() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    return undefined;
  }
  return AsyncStorage;
}

/**
 * Verifies whether valid Supabase public environment variables are present.
 * Strictly verifies non-empty, non-template string format.
 */
export function isSupabaseConfigured(): boolean {
  const url = Config.supabaseUrl;
  const key = Config.supabaseAnonKey;

  if (!url || !key) return false;
  if (url.includes('your-project') || key.includes('your-anon-key')) return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Returns the singleton Supabase client if properly configured,
 * or null if credentials are not provided (enabling deterministic test/offline execution).
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseInstance && Config.supabaseUrl && Config.supabaseAnonKey) {
    supabaseInstance = createClient(Config.supabaseUrl, Config.supabaseAnonKey, {
      auth: {
        storage: getSupabaseAuthStorage(),
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 20,
        },
      },
    });
  }

  return supabaseInstance;
}

/**
 * Resets the client singleton (used for testing or logout teardown).
 */
export function resetSupabaseClient(): void {
  supabaseInstance = null;
}
