import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { FeedItemModel } from '../types';

export interface FeedCreatorOverlayProps {
  item: FeedItemModel;
  onOpenCreator?: (item: FeedItemModel) => void;
  onToggleFollow?: (item: FeedItemModel) => void;
}

export const FeedCreatorOverlay: React.FC<FeedCreatorOverlayProps> = ({
  item,
  onOpenCreator,
  onToggleFollow,
}) => {
  const { typography } = useTheme();

  const handle = item.creator?.username ? `@${item.creator.username}` : '@creator';
  const displayName = item.creator?.displayName || 'Creator';
  const isVerified = item.creator?.verificationStatus === 'verified';
  const audioTitle = item.audio?.title || 'Original Sound';
  const audioArtist = item.audio?.artist || displayName;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Creator Info Header */}
      <View style={styles.creatorRow}>
        <TouchableOpacity
          onPress={() => onOpenCreator?.(item)}
          style={styles.creatorTouch}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`View ${displayName}'s profile`}
        >
          <Text style={[styles.handleText, { fontSize: typography.fontSize.base }]}>
            {handle}
          </Text>
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={10} color={BrandColors.black} />
            </View>
          )}
        </TouchableOpacity>

        {!item.isFollowingCreator && (
          <TouchableOpacity
            onPress={() => onToggleFollow?.(item)}
            style={styles.followButton}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Follow ${displayName}`}
          >
            <Text style={styles.followText}>Follow</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Caption & Hashtags */}
      {item.caption ? (
        <Text
          style={[styles.captionText, { fontSize: typography.fontSize.sm }]}
          numberOfLines={3}
        >
          {item.caption}{' '}
          {item.hashtags && item.hashtags.length > 0 && (
            <Text style={styles.hashtagText}>
              {item.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}
            </Text>
          )}
        </Text>
      ) : null}

      {/* Audio Track Ticker Row */}
      <View
        style={styles.audioRow}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={`Audio track: ${audioTitle} by ${audioArtist}`}
      >
        <Ionicons name="musical-notes" size={14} color={BrandColors.white} />
        <Text
          numberOfLines={1}
          style={[styles.audioText, { fontSize: typography.fontSize.xs }]}
        >
          {audioTitle} • {audioArtist}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    bottom: 24,
    right: 90,
    zIndex: 30,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  creatorTouch: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  handleText: {
    color: BrandColors.white,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: BrandColors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  followButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BrandColors.cyan,
    backgroundColor: 'rgba(37, 244, 238, 0.12)',
  },
  followText: {
    color: BrandColors.cyan,
    fontSize: 12,
    fontWeight: '700',
  },
  captionText: {
    color: BrandColors.white,
    lineHeight: 19,
    marginBottom: 8,
    fontWeight: '400',
  },
  hashtagText: {
    color: BrandColors.cyan,
    fontWeight: '600',
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioText: {
    color: BrandColors.white,
    marginLeft: 6,
    fontWeight: '500',
  },
});
