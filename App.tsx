import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme';
import { NavigationProvider } from './src/navigation';
import { ResponsiveShell } from './src/components/layout/ResponsiveShell';

const MainApp: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ResponsiveShell />
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationProvider>
          <MainApp />
        </NavigationProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
