import React from 'react';
import { View, StyleSheet, useWindowDimensions, SafeAreaView, Platform } from 'react-native';
import { useTheme } from '../../theme';
import { useNavigation } from '../../navigation';
import { BottomNav } from './BottomNav';
import { WebSidebar } from './WebSidebar';
import { WebContextualBar } from './WebContextualBar';
import { HomeScreen } from '../../features/feed/HomeScreen';
import { DiscoverScreen } from '../../features/discover/DiscoverScreen';
import { CreateScreen } from '../../features/create/CreateScreen';
import { InboxScreen } from '../../features/inbox/InboxScreen';
import { ProfileScreen } from '../../features/profile/ProfileScreen';
import { StoriesViewer } from '../../features/stories/StoriesViewer';
import { CreateStoryModal } from '../../features/stories/components/CreateStoryModal';

export const ResponsiveShell: React.FC = () => {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const {
    activeTab,
    setActiveTab,
    activeStory,
    isCreatingStory,
    closeStoryCreation,
  } = useNavigation();

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

  return (
    <View style={[styles.rootContainer, { backgroundColor: theme.background }]}>
      {/* Stories Full-Screen Modal Viewer (Accessible from Home & Profile, NOT bottom tab) */}
      {activeStory && <StoriesViewer params={activeStory} />}

      {/* Story Creation Flow Modal */}
      {isCreatingStory && (
        <CreateStoryModal
          visible={isCreatingStory}
          onClose={closeStoryCreation}
        />
      )}

      {isMobile ? (
        <SafeAreaView style={[styles.mobileContainer, { backgroundColor: theme.background }]}>
          <View style={styles.mobileScreenContent}>{renderActiveScreen()}</View>
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </SafeAreaView>
      ) : (
        /* Web & Desktop Responsive Layout (Sidebar + Center Content + Contextual Area) */
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    width: '100%',
    height: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    overflow: 'hidden',
  },
  mobileContainer: {
    flex: 1,
  },
  mobileScreenContent: {
    flex: 1,
  },
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
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
