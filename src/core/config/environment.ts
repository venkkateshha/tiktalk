/**
 * TikTalk Environment & Configuration Foundation
 * Centralized, type-safe configuration without hardcoded secrets
 */

export interface AppConfig {
  appName: string;
  appVersion: string;
  apiBaseUrl: string;
  wsBaseUrl: string;
  cdnBaseUrl: string;
  environment: 'development' | 'staging' | 'production';
  isProduction: boolean;
  isDevelopment: boolean;
  features: {
    storiesEnabled: boolean;
    analyticsEnabled: boolean;
    pushNotificationsEnabled: boolean;
    creatorMonetizationEnabled: boolean;
  };
}

// In React Native / Expo, env variables are read via process.env or build-time constants
export const Config: AppConfig = {
  appName: 'TikTalk',
  appVersion: '1.0.0',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.tiktalk.internal',
  wsBaseUrl: process.env.EXPO_PUBLIC_WS_BASE_URL || 'wss://realtime.tiktalk.internal',
  cdnBaseUrl: process.env.EXPO_PUBLIC_CDN_BASE_URL || 'https://cdn.tiktalk.internal',
  environment: (process.env.NODE_ENV as any) === 'production' ? 'production' : 'development',
  isProduction: (process.env.NODE_ENV as any) === 'production',
  isDevelopment: (process.env.NODE_ENV as any) !== 'production',
  features: {
    storiesEnabled: true,
    analyticsEnabled: true,
    pushNotificationsEnabled: true,
    creatorMonetizationEnabled: true,
  },
};
