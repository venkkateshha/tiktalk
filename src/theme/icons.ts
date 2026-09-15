/**
 * TikTalk Icon Sizing Tokens
 * Consistent icon scales across platforms
 */

export const IconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
  xxl: 40,
  display: 48,
} as const;

export type IconSizeKey = keyof typeof IconSizes;
