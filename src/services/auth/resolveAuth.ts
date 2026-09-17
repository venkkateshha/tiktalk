/**
 * TikTalk Auth Service Resolver
 * Resolves production SupabaseAuthAdapter when configured, or falls back to baseline AuthService.
 */

import { IAuthService } from './IAuthService';
import { authService } from './AuthService';
import { supabaseAuthAdapter } from './SupabaseAuthAdapter';
import { isSupabaseConfigured } from '../../core/supabase';

export function resolveDefaultAuthService(): IAuthService {
  if (isSupabaseConfigured()) {
    return supabaseAuthAdapter;
  }
  return authService;
}
