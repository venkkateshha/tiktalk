import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions, SafeAreaView, Platform } from 'react-native';
import { useTheme } from '../../theme';
import { NavigationTab } from '../../types';
import { BottomNav } from './BottomNav';
import { WebSidebar } from './WebSidebar';
import { WebContextualBar } from './WebContextualBar';
import { HomeScreen } from '../../features/feed/HomeScreen';
import { DiscoverScreen } from '../../features/discover/DiscoverScreen';
import { CreateScreen } from '../../features/create/CreateScreen';
import { InboxScreen } from '../../features/inbox/InboxScreen';
import { ProfileScreen } from '../../features/profile/ProfileScreen';

export const ResponsiveShell: React.FC = () => {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<NavigationTab>('Home');

  // Responsive Breakpoints:
  // - Mobile: width < 768
  // - Tablet: 768 <= width < 1080
  // - Desktop: width >= 1080
  const isMobile = width < 768;
  const isDesktop = width >= 1080;

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'Discover':
        return <DiscoverScreen />;
      case 'Create':
        return <CreateScreen />;
      case 'Inbox':
        return <InboxScreen />;
      case 'Profile':
        return <ProfileScreen />;
      case 'Home':
      default:
        return <HomeScreen />;
    }
  };

  if (isMobile) {
    return (
      <SafeAreaView style={[styles.mobileContainer, { backgroundColor: theme.background }]}>
        <View style={styles.mobileScreenContent}>{renderActiveScreen()}</View>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </SafeAreaView>
    );
  }

  // Web & Desktop Responsive Layout (Sidebar + Center Content + Contextual Area)
  return (
    <View style={[styles.desktopContainer, { backgroundColor: theme.background }]}>
      {/* Left Navigation Sidebar */}
      <WebSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Center Main Content Area */}
      <View style={[styles.desktopMainContent, { borderColor: theme.border }]}>
        {renderActiveScreen()}
      </View>

      {/* Right Contextual Area on Desktop */}
      {isDesktop && <WebContextualBar />}
    </View>
  );
};

const styles = StyleSheet.create({
  mobileContainer: {
    flex: 1,
  },
  mobileScreenContent: {
    flex: 1,
  },
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
    height: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    width: '100%',
    overflow: 'hidden',
  },
  desktopMainContent: {
    flex: 1,
    height: '100%',
    maxWidth: 800,
    borderRightWidth: 1,
    alignSelf: 'center',
  },
});
