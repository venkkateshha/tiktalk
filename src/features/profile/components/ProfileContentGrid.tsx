import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { ProfileTab, ProfileVideoItem } from '../types';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface ProfileContentGridProps {
  activeTab: ProfileTab;
  videos: ProfileVideoItem[];
  isLoading: boolean;
  onTabChange: (tab: ProfileTab) => void;
  onSelectVideo?: (video: ProfileVideoItem) => void;
}

export const ProfileContentGrid: React.FC<ProfileContentGridProps> = ({
  activeTab,
  videos,
  isLoading,
  onTabChange,
  onSelectVideo,
}) => {
  const { theme, typography } = useTheme();
  const { width } = useWindowDimensions();

  // Responsive column calculation: 3 columns on mobile (<600px), 4 columns on larger screens
  const numColumns = width >= 600 ? 4 : 3;
  const itemWidthPercent = `${100 / numColumns}%`;

  const tabs: { key: ProfileTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'videos', label: 'Videos', icon: 'grid-outline' },
    { key: 'liked', label: 'Liked', icon: 'heart-outline' },
    { key: 'saved', label: 'Saved', icon: 'bookmark-outline' },
  ];

  const formatViews = (views: number) => {
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
    if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel="Profile content tabs and video grid"
    >
      {/* Tab Navigation Bar */}
      <View
        style={[styles.tabsBar, { borderBottomColor: theme.border }]}
        accessible={true}
        accessibilityRole="tablist"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onTabChange(tab.key)}
              style={[
                styles.tabItem,
                A11yStandards.minTouchTarget,
                isActive && { borderBottomColor: BrandColors.cyan, borderBottomWidth: 2 },
              ]}
              accessible={true}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label} tab`}
            >
              <Ionicons
                name={tab.icon}
                size={20}
                color={isActive ? BrandColors.cyan : theme.textSecondary}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Grid Content or Empty / Loading State */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BrandColors.cyan} />
        </View>
      ) : videos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: theme.card }]}>
            <Ionicons
              name={
                activeTab === 'videos'
                  ? 'videocam-outline'
                  : activeTab === 'liked'
                  ? 'heart-dislike-outline'
                  : 'bookmark-outline'
              }
              size={36}
              color={theme.textSecondary}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text, fontSize: typography.fontSize.md }]}>
            {activeTab === 'videos'
              ? 'No Videos Uploaded Yet'
              : activeTab === 'liked'
              ? 'No Liked Videos Yet'
              : 'No Saved Videos'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]}>
            {activeTab === 'videos'
              ? 'When this creator shares 60 FPS vertical video shorts, they will appear here.'
              : activeTab === 'liked'
              ? 'Videos you like will be organized here privately.'
              : 'Bookmark your favorite videos to view them anytime.'}
          </Text>
        </View>
      ) : (
        <View style={styles.gridContainer}>
          {videos.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => onSelectVideo && onSelectVideo(item)}
              style={[
                styles.videoCard,
                { width: itemWidthPercent as any },
                A11yStandards.minTouchTarget,
              ]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Video with ${formatViews(item.viewCount)} views: ${item.caption || 'TikTalk video'}`}
            >
              <View style={[styles.thumbnail, { backgroundColor: '#111111' }]}>
                {/* Views Counter */}
                <View style={styles.viewsOverlay}>
                  <Ionicons name="play-outline" size={12} color="#FFFFFF" />
                  <Text style={styles.viewsText}>{formatViews(item.viewCount)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 8,
  },
  tabsBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 44,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  videoCard: {
    aspectRatio: 9 / 16,
    padding: 1,
  },
  thumbnail: {
    flex: 1,
    position: 'relative',
    justifyContent: 'flex-end',
    padding: 6,
  },
  viewsOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewsText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
  },
});
