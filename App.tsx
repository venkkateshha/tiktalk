import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme';
import { NavigationProvider } from './src/navigation';
import { ResponsiveShell } from './src/components/layout/ResponsiveShell';
import { CallProvider } from './src/features/calls/context/CallContext';
import { CallOverlay } from './src/features/calls/components/CallOverlay';
import { bootstrapAuthSession } from './src/core/auth/devAuthBridge';

const AuthBootstrap: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    bootstrapAuthSession().finally(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
};

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
          <AuthBootstrap>
            {/* CallProvider must wrap the whole tree so any screen can initiate/receive calls */}
            <CallProvider>
              <MainApp />
            </CallProvider>
          </AuthBootstrap>
        </NavigationProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
