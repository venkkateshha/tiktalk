import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { ColorScheme, DarkThemeColors, LightThemeColors, BrandColors } from './colors';
import { Typography } from './typography';
import { Spacing, BorderRadius } from './spacing';
import { Elevation } from './elevation';
import { IconSizes } from './icons';
import { Motion } from './motion';

export type ThemeMode = 'dark' | 'light';
export type ThemePreference = 'system' | 'dark' | 'light';

export interface ThemeContextValue {
  theme: ColorScheme;
  mode: ThemeMode;
  preference: ThemePreference;
  isDark: boolean;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
  setPreference: (pref: ThemePreference) => void;
  typography: typeof Typography;
  spacing: typeof Spacing;
  borderRadius: typeof BorderRadius;
  elevation: typeof Elevation;
  iconSizes: typeof IconSizes;
  motion: typeof Motion;
  brandColors: typeof BrandColors;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: React.ReactNode;
  initialPreference?: ThemePreference;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialPreference = 'dark', // Default to Dark Mode for immersive video-first experience
}) => {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>(initialPreference);

  // Compute resolved mode based on user preference or OS system theme
  const resolvedMode: ThemeMode = useMemo(() => {
    if (preference === 'system') {
      return systemScheme === 'light' ? 'light' : 'dark';
    }
    return preference;
  }, [preference, systemScheme]);

  const isDark = resolvedMode === 'dark';
  const theme = isDark ? DarkThemeColors : LightThemeColors;

  const toggleTheme = useCallback(() => {
    setPreference((prev) => {
      const current = prev === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : prev;
      return current === 'dark' ? 'light' : 'dark';
    });
  }, [systemScheme]);

  const setMode = useCallback((mode: ThemeMode) => {
    setPreference(mode);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      mode: resolvedMode,
      preference,
      isDark,
      toggleTheme,
      setMode,
      setPreference,
      typography: Typography,
      spacing: Spacing,
      borderRadius: BorderRadius,
      elevation: Elevation,
      iconSizes: IconSizes,
      motion: Motion,
      brandColors: BrandColors,
    }),
    [theme, resolvedMode, preference, isDark, toggleTheme, setMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
