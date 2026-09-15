import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../../theme';
import { BrandColors } from '../../theme/colors';
import { Header } from '../../components/ui/Header';
import { StoriesRail, StorySummary } from '../../components/ui/StoriesRail';
import { useNavigation } from '../../navigation';
import { useFeed } from './hooks/useFeed';
import { VerticalVideoFeed } from './components/VerticalVideoFeed';
import { FeedStateView } from './components/FeedStateView';
import { FeedItemModel } from './types';

export const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const { openStories } = useNavigation();

  // Phase 2 Feed Hook (Manages domain models, state, optimistic updates, player lifecycle)
  const feed = useFeed('forYou');

  // Stories system: Preserved strictly from Phase 1 (Home rail + Profile, NOT bottom navigation)
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
        stories={storiesList}
        onSelectStory={handleSelectStory}
        onAddStory={handleAddStory}
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
