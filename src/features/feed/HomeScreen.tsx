import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { BrandColors } from '../../theme/colors';
import { FeedType } from '../../domain/post';
import { Header } from '../../components/ui/Header';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { StoriesRail, StorySummary } from '../../components/ui/StoriesRail';
import { useNavigation } from '../../navigation';
import { Ionicons } from '@expo/vector-icons';

export const HomeScreen: React.FC = () => {
  const { theme, typography } = useTheme();
  const { openStories } = useNavigation();
  const [activeFeed, setActiveFeed] = useState<FeedType>('forYou');
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  // Sample stories available in foundation (without fake business data)
  const storiesList: StorySummary[] = [
    { userId: 'tiktalk', username: 'TikTalk', hasUnseenStories: true },
    { userId: 'creator_hub', username: 'CreatorHub', hasUnseenStories: true },
    { userId: 'music_lab', username: 'MusicLab', hasUnseenStories: false },
  ];

  const handleSelectStory = (story: StorySummary) => {
    openStories({
      userId: story.userId,
      entryPoint: 'home_rail',
    });
  };

  const handleAddStory = () => {
    openStories({
      userId: 'current_user',
      entryPoint: 'home_rail',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header with Following / For You & Theme Switcher */}
      <Header activeFeed={activeFeed as any} onFeedChange={(feed) => setActiveFeed(feed as FeedType)} />

      {/* Stories Rail: Accessible from Home Feed (NOT a bottom tab) */}
      <StoriesRail
        stories={storiesList}
        onSelectStory={handleSelectStory}
        onAddStory={handleAddStory}
      />

      {/* Main Video Viewport Area */}
      <View style={[styles.viewport, { backgroundColor: BrandColors.black }]}>
        {/* Feed Center Canvas */}
        <View style={styles.centerCanvas}>
          <EmptyState
            title={activeFeed === 'forYou' ? 'For You Feed Initialized' : 'Following Feed Ready'}
            badgeText="Phase 1 — Architecture"
            description={
              activeFeed === 'forYou'
                ? 'The TikTalk High-Performance 60 FPS video player is connected to the Cloudflare R2 streaming edge. No videos have been published yet.'
                : 'Follow creators to see their latest 60 FPS shorts here. Your following feed will update in real-time.'
            }
            iconName={activeFeed === 'forYou' ? 'flame-outline' : 'people-outline'}
          />

          {/* Quick Engine Status Card */}
          <View style={[styles.engineCard, { backgroundColor: 'rgba(26, 26, 26, 0.85)', borderColor: BrandColors.darkBorder }]}>
            <View style={styles.engineHeader}>
              <Badge label="Phase 1 Architecture" variant="primary" />
              <Badge label="60% RevShare" variant="accent" />
            </View>
            <Text style={[styles.engineText, { color: BrandColors.white, fontSize: typography.fontSize.xs }]}>
              Adaptive HLS • WebRTC P2P Swarm • Double-Entry Ledger
            </Text>
          </View>
        </View>

        {/* Right Side Action Dock (MNC Standard) */}
        <View style={styles.actionDock}>
          {/* Creator Avatar with Follow '+' badge */}
          <TouchableOpacity
            style={styles.avatarButton}
            activeOpacity={0.8}
            onPress={() => openStories({ userId: 'tiktalk', entryPoint: 'home_rail' })}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="View creator story"
          >
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={20} color={BrandColors.black} />
            </View>
            <View style={styles.followBadge}>
              <Ionicons name="add" size={12} color={BrandColors.white} />
            </View>
          </TouchableOpacity>

          {/* Like Button */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => setIsLiked(!isLiked)}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isLiked ? 'Unlike video' : 'Like video'}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={34}
              color={isLiked ? BrandColors.pink : BrandColors.white}
            />
            <Text style={[styles.actionCount, { color: BrandColors.white }]}>
              {isLiked ? '1' : '0'}
            </Text>
          </TouchableOpacity>

          {/* Comment Button */}
          <TouchableOpacity
            style={styles.actionItem}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Comments"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={32} color={BrandColors.white} />
            <Text style={[styles.actionCount, { color: BrandColors.white }]}>0</Text>
          </TouchableOpacity>

          {/* Bookmark Button */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => setIsBookmarked(!isBookmarked)}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Bookmark video'}
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={30}
              color={isBookmarked ? BrandColors.cyan : BrandColors.white}
            />
            <Text style={[styles.actionCount, { color: BrandColors.white }]}>Save</Text>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity
            style={styles.actionItem}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Share video"
          >
            <Ionicons name="share-social-outline" size={32} color={BrandColors.white} />
            <Text style={[styles.actionCount, { color: BrandColors.white }]}>Share</Text>
          </TouchableOpacity>

          {/* Rotating Vinyl Audio Disc */}
          <View style={styles.vinylDiscContainer}>
            <View style={styles.vinylDiscOuter}>
              <View style={styles.vinylDiscInner}>
                <Ionicons name="musical-notes" size={14} color={BrandColors.cyan} />
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Metadata & Marquee Audio Ticker */}
        <View style={styles.bottomMeta}>
          <Text style={[styles.creatorHandle, { color: BrandColors.white, fontSize: typography.fontSize.base }]}>
            @tiktalk <Text style={{ color: BrandColors.cyan }}>✓</Text>
          </Text>
          <Text style={[styles.videoCaption, { color: BrandColors.white, fontSize: typography.fontSize.sm }]} numberOfLines={2}>
            Welcome to TikTalk. World-class social platform with 60% creator share & weekly payouts. #tiktalk #creator
          </Text>

          {/* Audio Marquee Ticker */}
          <View style={styles.audioTickerRow}>
            <Ionicons name="musical-note" size={14} color={BrandColors.white} />
            <Text style={[styles.audioTickerText, { color: BrandColors.white, fontSize: typography.fontSize.xs }]}>
              Original Sound - TikTalk Master Anthem 🎵
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  viewport: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  centerCanvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  engineCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 12,
    maxWidth: 360,
    width: '100%',
  },
  engineHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  engineText: {
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  actionDock: {
    position: 'absolute',
    right: 12,
    bottom: 80,
    alignItems: 'center',
    gap: 16,
    zIndex: 20,
  },
  avatarButton: {
    alignItems: 'center',
    marginBottom: 4,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BrandColors.white,
    borderWidth: 2,
    borderColor: BrandColors.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BrandColors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,
  },
  actionItem: {
    alignItems: 'center',
  },
  actionCount: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  vinylDiscContainer: {
    marginTop: 8,
  },
  vinylDiscOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E1E1E',
    borderWidth: 8,
    borderColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vinylDiscInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BrandColors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomMeta: {
    position: 'absolute',
    left: 16,
    bottom: 24,
    right: 80,
    zIndex: 20,
  },
  creatorHandle: {
    fontWeight: '800',
    marginBottom: 4,
  },
  videoCaption: {
    lineHeight: 18,
    fontWeight: '400',
    marginBottom: 8,
  },
  audioTickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioTickerText: {
    marginLeft: 6,
    fontWeight: '500',
  },
});
