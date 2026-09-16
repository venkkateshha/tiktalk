import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme';
import { NavigationProvider } from './src/navigation';
import { ResponsiveShell } from './src/components/layout/ResponsiveShell';
import { CallProvider } from './src/features/calls/context/CallContext';
import { CallOverlay } from './src/features/calls/components/CallOverlay';

const MainApp: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ResponsiveShell />
      {/* Phase 10: Global voice/video call overlays (banner, modal, PiP) */}
      <CallOverlay />
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationProvider>
          {/* CallProvider must wrap the whole tree so any screen can initiate/receive calls */}
          <CallProvider>
            <MainApp />
          </CallProvider>
        </NavigationProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
