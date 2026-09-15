import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
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

export const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const { openStories, openStoryCreation } = useNavigation();

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
    // Comments sheet boundary for future phase
  };

  const handleShare = (item: FeedItemModel) => {
    // Share sheet boundary for future phase
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
});
