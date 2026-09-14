/**
 * TikTalk Locked Design System Colors
 * Strict Brand Colors:
 * - Black: #000000
 * - White: #FFFFFF
 * - Cyan: #25F4EE
 * - Pink/Red: #FE2C55
 * 
 * Themes: Dark Mode & Light Mode only. No third theme.
 */

export const BrandColors = {
  black: '#000000',
  white: '#FFFFFF',
  cyan: '#25F4EE',
  pink: '#FE2C55',
  // Tonal variations strictly derived from Black and White neutrals
  darkSurface: '#121212',
  darkCard: '#1A1A1A',
  darkBorder: '#2A2A2A',
  darkTextSecondary: '#8E8E93',
  lightSurface: '#F8F8F8',
  lightCard: '#FFFFFF',
  lightBorder: '#E5E5EA',
  lightTextSecondary: '#666666',
} as const;

export interface ColorScheme {
  background: string;
  surface: string;
  card: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;       // Cyan #25F4EE
  accent: string;        // Pink/Red #FE2C55
  onPrimary: string;
  onAccent: string;
  navBackground: string;
  navBorder: string;
}

export const DarkThemeColors: ColorScheme = {
  background: BrandColors.black,
  surface: BrandColors.darkSurface,
  card: BrandColors.darkCard,
  border: BrandColors.darkBorder,
  text: BrandColors.white,
  textSecondary: BrandColors.darkTextSecondary,
  textMuted: '#555555',
  primary: BrandColors.cyan,
  accent: BrandColors.pink,
  onPrimary: BrandColors.black,
  onAccent: BrandColors.white,
  navBackground: 'rgba(0, 0, 0, 0.95)',
  navBorder: BrandColors.darkBorder,
};

export const LightThemeColors: ColorScheme = {
  background: BrandColors.white,
  surface: BrandColors.lightSurface,
  card: BrandColors.lightCard,
  border: BrandColors.lightBorder,
  text: BrandColors.black,
  textSecondary: BrandColors.lightTextSecondary,
  textMuted: '#999999',
  primary: BrandColors.cyan,
  accent: BrandColors.pink,
  onPrimary: BrandColors.black,
  onAccent: BrandColors.white,
  navBackground: 'rgba(255, 255, 255, 0.95)',
  navBorder: BrandColors.lightBorder,
};
