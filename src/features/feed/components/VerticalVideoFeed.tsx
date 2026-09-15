import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Platform,
  useWindowDimensions,
  ViewToken,
} from 'react-native';
import { FeedItemModel } from '../types';
import { FeedItemView } from './FeedItemView';
import { BrandColors } from '../../../theme/colors';

export interface VerticalVideoFeedProps {
  items: FeedItemModel[];
  activeIndex: number;
  isPlaying: boolean;
  isMuted: boolean;
  onActiveIndexChange: (index: number) => void;
  onTogglePlayPause: () => void;
  onToggleMute: () => void;
  onToggleLike: (item: FeedItemModel) => void;
  onToggleSave: (item: FeedItemModel) => void;
  onToggleFollow: (item: FeedItemModel) => void;
  onToggleRepost: (item: FeedItemModel) => void;
  onOpenCreator?: (item: FeedItemModel) => void;
  onOpenComments?: (item: FeedItemModel) => void;
  onShare?: (item: FeedItemModel) => void;
  onEndReached?: () => void;
}

export const VerticalVideoFeed: React.FC<VerticalVideoFeedProps> = ({
  items,
  activeIndex,
  isPlaying,
  isMuted,
  onActiveIndexChange,
  onTogglePlayPause,
  onToggleMute,
  onToggleLike,
  onToggleSave,
  onToggleFollow,
  onToggleRepost,
  onOpenCreator,
  onOpenComments,
  onShare,
  onEndReached,
}) => {
  const { height: windowHeight } = useWindowDimensions();
  const flatListRef = useRef<FlatList<FeedItemModel>>(null);

  // Web Keyboard Navigation: ArrowUp, ArrowDown, Space (play/pause), 'm' (mute/unmute)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keyboard if user is focused inside an input/textarea
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (activeIndex < items.length - 1) {
          const nextIndex = activeIndex + 1;
          onActiveIndexChange(nextIndex);
          flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (activeIndex > 0) {
          const prevIndex = activeIndex - 1;
          onActiveIndexChange(prevIndex);
          flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        onTogglePlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        onToggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeIndex, items.length, onActiveIndexChange, onTogglePlayPause, onToggleMute]);

  // Viewable items changed callback for mobile/touch paging
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems && viewableItems.length > 0) {
        const firstVisible = viewableItems[0];
        if (typeof firstVisible.index === 'number' && firstVisible.index !== activeIndex) {
          onActiveIndexChange(firstVisible.index);
        }
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: windowHeight,
      offset: windowHeight * index,
      index,
    }),
    [windowHeight]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: FeedItemModel; index: number }) => {
      // Virtualization guard: Only mount media for active item and immediate neighbours (previous/next)
      const isWithinWindow = Math.abs(index - activeIndex) <= 1;
      const isActive = index === activeIndex;

      if (!isWithinWindow) {
        return (
          <View
            style={[styles.placeholderItem, { height: windowHeight }]}
            accessible={false}
          />
        );
      }

      return (
        <FeedItemView
          item={item}
          isActive={isActive}
          isPlaying={isPlaying}
          isMuted={isMuted}
          height={windowHeight}
          onTogglePlayPause={onTogglePlayPause}
          onToggleMute={onToggleMute}
          onToggleLike={onToggleLike}
          onToggleSave={onToggleSave}
          onToggleFollow={onToggleFollow}
          onToggleRepost={onToggleRepost}
          onOpenCreator={onOpenCreator}
          onOpenComments={onOpenComments}
          onShare={onShare}
        />
      );
    },
    [
      activeIndex,
      isPlaying,
      isMuted,
      windowHeight,
      onTogglePlayPause,
      onToggleMute,
      onToggleLike,
      onToggleSave,
      onToggleFollow,
      onToggleRepost,
      onOpenCreator,
      onOpenComments,
      onShare,
    ]
  );

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel="Vertical short-video feed"
    >
      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled={true}
        showsVerticalScrollIndicator={false}
        snapToInterval={windowHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={getItemLayout}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews={Platform.OS !== 'web'}
        style={styles.flatList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: BrandColors.black,
    overflow: 'hidden',
  },
  flatList: {
    flex: 1,
  },
  placeholderItem: {
    width: '100%',
    backgroundColor: BrandColors.black,
  },
});
