import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { ColorScheme, DarkThemeColors, LightThemeColors } from './colors';
import { Typography } from './typography';
import { Spacing, BorderRadius } from './spacing';

export type ThemeMode = 'dark' | 'light';

export interface ThemeContextValue {
  theme: ColorScheme;
  mode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
  typography: typeof Typography;
  spacing: typeof Spacing;
  borderRadius: typeof BorderRadius;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  // Default to Dark Mode as per short-video platform immersion standard
  const [mode, setMode] = useState<ThemeMode>('dark');

  const isDark = mode === 'dark';
  const theme = isDark ? DarkThemeColors : LightThemeColors;

  const toggleTheme = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const value = useMemo(
    () => ({
      theme,
      mode,
      isDark,
      toggleTheme,
      setMode,
      typography: Typography,
      spacing: Spacing,
      borderRadius: BorderRadius,
    }),
    [mode, isDark, theme]
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
