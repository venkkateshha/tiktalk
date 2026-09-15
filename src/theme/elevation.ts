/**
 * TikTalk Elevation & Shadow Design Tokens
 * Cross-platform shadows supporting Web, iOS, and Android
 */

import { Platform, ViewStyle } from 'react-native';

export interface ElevationToken {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export const Elevation: Record<'none' | 'sm' | 'md' | 'lg', ViewStyle> = {
  none: {
    ...Platform.select({
      web: { boxShadow: 'none' } as ViewStyle,
      default: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
      },
    }),
  },
  sm: {
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' } as ViewStyle,
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  md: {
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)' } as ViewStyle,
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  lg: {
    ...Platform.select({
      web: { boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)' } as ViewStyle,
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
};
