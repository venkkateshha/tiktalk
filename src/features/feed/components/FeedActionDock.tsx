import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { FeedItemModel } from '../types';
import { Avatar } from '../../../components/ui/Avatar';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface FeedActionDockProps {
  item: FeedItemModel;
  onToggleLike: (item: FeedItemModel) => void;
  onToggleSave: (item: FeedItemModel) => void;
  onToggleFollow: (item: FeedItemModel) => void;
  onToggleRepost: (item: FeedItemModel) => void;
  onOpenComments?: (item: FeedItemModel) => void;
  onShare?: (item: FeedItemModel) => void;
  onOpenCreator?: (item: FeedItemModel) => void;
}

export const FeedActionDock: React.FC<FeedActionDockProps> = ({
  item,
  onToggleLike,
  onToggleSave,
  onToggleFollow,
  onToggleRepost,
  onOpenComments,
  onShare,
  onOpenCreator,
}) => {
  const { brandColors } = useTheme();

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="toolbar"
      accessibilityLabel="Video actions"
    >
      {/* 1. Creator Avatar with Follow Button */}
      <View style={styles.avatarSlot}>
        <Avatar
          source={item.creator?.avatarUrl}
          name={item.creator?.displayName || 'Creator'}
          size="md"
          isVerified={item.creator?.verificationStatus === 'verified'}
          onPress={() => onOpenCreator?.(item)}
        />
        {!item.isFollowingCreator && (
          <TouchableOpacity
            style={[styles.followPlusBadge, A11yStandards.minTouchTarget]}
            onPress={() => onToggleFollow(item)}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Follow ${item.creator?.displayName || 'creator'}`}
          >
            <Ionicons name="add" size={14} color={brandColors.white} />
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Like Button (Pink/Red active) */}
      <TouchableOpacity
        style={[styles.actionButton, A11yStandards.minTouchTarget]}
        onPress={() => onToggleLike(item)}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={item.isLiked ? 'Unlike video' : 'Like video'}
        accessibilityState={{ selected: item.isLiked }}
      >
        <Ionicons
          name={item.isLiked ? 'heart' : 'heart-outline'}
          size={32}
          color={item.isLiked ? brandColors.pink : brandColors.white}
        />
        <Text style={[styles.actionLabel, { color: brandColors.white }]}>
          {item.engagement.likeCount > 0 ? String(item.engagement.likeCount) : 'Like'}
        </Text>
      </TouchableOpacity>

      {/* 3. Comment Button */}
      <TouchableOpacity
        style={[styles.actionButton, A11yStandards.minTouchTarget]}
        onPress={() => onOpenComments?.(item)}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="View comments"
      >
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={30}
          color={brandColors.white}
        />
        <Text style={[styles.actionLabel, { color: brandColors.white }]}>
          {item.engagement.commentCount > 0 ? String(item.engagement.commentCount) : 'Reply'}
        </Text>
      </TouchableOpacity>

      {/* 4. Save / Bookmark Button (Cyan active) */}
      <TouchableOpacity
        style={[styles.actionButton, A11yStandards.minTouchTarget]}
        onPress={() => onToggleSave(item)}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={item.isSaved ? 'Remove bookmark' : 'Bookmark video'}
        accessibilityState={{ selected: item.isSaved }}
      >
        <Ionicons
          name={item.isSaved ? 'bookmark' : 'bookmark-outline'}
          size={28}
          color={item.isSaved ? brandColors.cyan : brandColors.white}
        />
        <Text style={[styles.actionLabel, { color: brandColors.white }]}>
          {item.engagement.bookmarkCount > 0 ? String(item.engagement.bookmarkCount) : 'Save'}
        </Text>
      </TouchableOpacity>

      {/* 5. Repost Button (Cyan active) */}
      <TouchableOpacity
        style={[styles.actionButton, A11yStandards.minTouchTarget]}
        onPress={() => onToggleRepost(item)}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={item.isReposted ? 'Undo repost' : 'Repost video'}
        accessibilityState={{ selected: item.isReposted }}
      >
        <Ionicons
          name="repeat"
          size={28}
          color={item.isReposted ? brandColors.cyan : brandColors.white}
        />
        <Text style={[styles.actionLabel, { color: brandColors.white }]}>
          Repost
        </Text>
      </TouchableOpacity>

      {/* 6. Share Button */}
      <TouchableOpacity
        style={[styles.actionButton, A11yStandards.minTouchTarget]}
        onPress={() => onShare?.(item)}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Share video"
      >
        <Ionicons
          name="share-social-outline"
          size={30}
          color={brandColors.white}
        />
        <Text style={[styles.actionLabel, { color: brandColors.white }]}>
          Share
        </Text>
      </TouchableOpacity>

      {/* 7. Rotating Vinyl Audio Disc */}
      <View style={styles.vinylSlot}>
        <View style={styles.vinylDiscOuter}>
          <View style={styles.vinylDiscInner}>
            <Ionicons name="musical-notes" size={12} color={BrandColors.cyan} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 12,
    bottom: 40,
    alignItems: 'center',
    gap: 14,
    zIndex: 35,
  },
  avatarSlot: {
    alignItems: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  followPlusBadge: {
    position: 'absolute',
    bottom: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: BrandColors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BrandColors.black,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  vinylSlot: {
    marginTop: 4,
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
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: BrandColors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
