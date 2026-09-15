import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { FeedItemModel } from '../types';
import { VideoPlayerView } from '../player';
import { FeedActionDock } from './FeedActionDock';
import { FeedCreatorOverlay } from './FeedCreatorOverlay';
import { BrandColors } from '../../../theme/colors';

export interface FeedItemViewProps {
  item: FeedItemModel;
  isActive: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  onTogglePlayPause: () => void;
  onToggleMute: () => void;
  onToggleLike: (item: FeedItemModel) => void;
  onToggleSave: (item: FeedItemModel) => void;
  onToggleFollow: (item: FeedItemModel) => void;
  onToggleRepost: (item: FeedItemModel) => void;
  onOpenCreator?: (item: FeedItemModel) => void;
  onOpenComments?: (item: FeedItemModel) => void;
  onShare?: (item: FeedItemModel) => void;
  height?: number;
}

export const FeedItemView: React.FC<FeedItemViewProps> = ({
  item,
  isActive,
  isPlaying,
  isMuted,
  onTogglePlayPause,
  onToggleMute,
  onToggleLike,
  onToggleSave,
  onToggleFollow,
  onToggleRepost,
  onOpenCreator,
  onOpenComments,
  onShare,
  height,
}) => {
  return (
    <View
      style={[styles.container, height ? { height } : styles.fullHeight]}
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={`Video by ${item.creator?.displayName || 'Creator'}: ${item.caption || 'TikTalk Video'}`}
    >
      {/* 1. Underlying Video Player Abstraction */}
      <VideoPlayerView
        mediaUrl={item.media?.url}
        thumbnailUrl={item.media?.thumbnailUrl}
        isActive={isActive}
        isPlaying={isPlaying}
        isMuted={isMuted}
        onTogglePlayPause={onTogglePlayPause}
        onToggleMute={onToggleMute}
      />

      {/* 2. Left Overlay: Creator Info, Caption, Audio Ticker */}
      <FeedCreatorOverlay
        item={item}
        onOpenCreator={onOpenCreator}
        onToggleFollow={onToggleFollow}
      />

      {/* 3. Right Overlay: Action Dock (Like, Comment, Save, Repost, Share, Vinyl) */}
      <FeedActionDock
        item={item}
        onToggleLike={onToggleLike}
        onToggleSave={onToggleSave}
        onToggleFollow={onToggleFollow}
        onToggleRepost={onToggleRepost}
        onOpenComments={onOpenComments}
        onShare={onShare}
        onOpenCreator={onOpenCreator}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    backgroundColor: BrandColors.black,
    overflow: 'hidden',
  },
  fullHeight: {
    height: Dimensions.get('window').height,
  },
});
