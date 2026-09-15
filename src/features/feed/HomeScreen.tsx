import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../../theme';
import { BrandColors } from '../../theme/colors';
import { Header } from '../../components/ui/Header';
import { StoriesRail, StorySummary } from '../../components/ui/StoriesRail';
import { useNavigation } from '../../navigation';
import { useFeed } from './hooks/useFeed';
import { useStories } from '../stories/hooks/useStories';
import { VerticalVideoFeed } from './components/VerticalVideoFeed';
import { FeedStateView } from './components/FeedStateView';
import { FeedItemModel } from './types';
import { CommentsSheet } from '../../components/engagement';
import { shareService } from '../../services/engagement';

export const HomeScreen: React.FC = () => {
  const { theme, typography } = useTheme();
  const { openStories, openStoryCreation } = useNavigation();

  const [activeCommentsPost, setActiveCommentsPost] = useState<FeedItemModel | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Phase 2 Feed Hook (Manages domain models, state, optimistic updates, player lifecycle)
  const feed = useFeed('forYou');

  // Phase 6 Unified Stories System: Powered by real service & local persistence
  const stories = useStories();

  const followedStoriesList: StorySummary[] = stories.storyGroups
    .filter((g) => g.userId !== 'me' && g.username !== 'tiktalk.creator')
    .map((g) => ({
      userId: g.userId,
      username: g.username,
      avatarUrl: g.avatarUrl,
      hasUnseenStories: g.hasUnseenStories,
    }));

  const handleSelectStory = (story: StorySummary) => {
    openStories({
      userId: story.userId,
      entryPoint: 'home_rail',
    });
  };

  const handleAddStory = () => {
    openStoryCreation();
  };

  const handleViewUserStory = () => {
    openStories({
      userId: 'me',
      entryPoint: 'home_rail',
    });
  };

  const handleOpenCreator = (item: FeedItemModel) => {
    if (item.creator?.username) {
      openStories({
        userId: item.creator.username,
        entryPoint: 'home_rail',
      });
    }
  };

  const handleOpenComments = (item: FeedItemModel) => {
    setActiveCommentsPost(item);
  };

  const handleShare = async (item: FeedItemModel) => {
    const res = await shareService.sharePost({
      postId: item.id,
      caption: item.caption,
      authorUsername: item.creator?.username,
    });
    if (res.message) {
      showToast(res.message);
    }
  };

  const hasFeedContent = feed.status === 'success' && feed.items.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 1. Top Header with Following / For You & Theme Switcher */}
      <Header
        activeFeed={feed.filter as any}
        onFeedChange={(filter) => feed.setFilter(filter as any)}
      />

      {/* 2. Stories Rail: Preserved from Phase 1, accessible right on Home Feed */}
      <StoriesRail
        stories={followedStoriesList}
        userHasStory={stories.hasUserStory}
        onSelectStory={handleSelectStory}
        onAddStory={handleAddStory}
        onViewUserStory={handleViewUserStory}
      />

      {/* 3. Main Vertical Video Feed Viewport */}
      <View style={[styles.viewport, { backgroundColor: BrandColors.black }]}>
        {hasFeedContent ? (
          <VerticalVideoFeed
            items={feed.items}
            activeIndex={feed.activeIndex}
            isPlaying={feed.isPlaying}
            isMuted={feed.isMuted}
            onActiveIndexChange={feed.setActiveIndex}
            onTogglePlayPause={feed.togglePlayPause}
            onToggleMute={feed.toggleMute}
            onToggleLike={feed.toggleLike}
            onToggleSave={feed.toggleSave}
            onToggleFollow={feed.toggleFollow}
            onToggleRepost={feed.toggleRepost}
            onOpenCreator={handleOpenCreator}
            onOpenComments={handleOpenComments}
            onShare={handleShare}
            onEndReached={feed.loadMore}
          />
        ) : (
          <FeedStateView
            status={feed.status}
            filter={feed.filter}
            errorMessage={feed.errorMessage}
            onRetry={feed.refresh}
          />
        )}
      </View>

      {/* 4. Comments Bottom Sheet (Video playback continues underneath uninterrupted) */}
      {activeCommentsPost && (
        <CommentsSheet
          visible={Boolean(activeCommentsPost)}
          postId={activeCommentsPost.id}
          commentCount={activeCommentsPost.engagement.commentCount}
          onClose={() => setActiveCommentsPost(null)}
        />
      )}

      {/* Floating Toast Notice */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <View style={[styles.toastCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.toastText, { color: BrandColors.cyan, fontSize: typography.fontSize.xs }]}>
              {toastMessage}
            </Text>
          </View>
        </View>
      )}
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
    overflow: 'hidden',
  },
  toastContainer: {
    position: 'absolute',
    top: 70,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 999,
  },
  toastCard: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastText: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
