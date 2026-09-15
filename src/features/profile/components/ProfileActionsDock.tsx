import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { FollowState } from '../types';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface ProfileActionsDockProps {
  isOwner: boolean;
  followState?: FollowState;
  isPrivate?: boolean;
  onEditProfile?: () => void;
  onShareProfile?: () => void;
  onToggleFollow?: () => void;
  onMessage?: () => void;
  onOptions?: () => void;
}

export const ProfileActionsDock: React.FC<ProfileActionsDockProps> = ({
  isOwner,
  followState = 'none',
  onEditProfile,
  onShareProfile,
  onToggleFollow,
  onMessage,
  onOptions,
}) => {
  const { theme, typography } = useTheme();

  if (isOwner) {
    return (
      <View
        style={styles.container}
        accessible={true}
        accessibilityRole="none"
        accessibilityLabel="Owner profile actions"
      >
        <TouchableOpacity
          onPress={onEditProfile}
          style={[
            styles.actionButton,
            A11yStandards.minTouchTarget,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Edit profile details"
        >
          <Ionicons name="create-outline" size={16} color={theme.text} />
          <Text style={[styles.actionText, { color: theme.text, fontSize: typography.fontSize.sm }]}>
            Edit Profile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onShareProfile}
          style={[
            styles.actionButton,
            A11yStandards.minTouchTarget,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Share profile link"
        >
          <Ionicons name="share-social-outline" size={16} color={theme.text} />
          <Text style={[styles.actionText, { color: theme.text, fontSize: typography.fontSize.sm }]}>
            Share Profile
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Visitor Mode
  const isFollowing = followState === 'following';
  const isRequested = followState === 'requested';

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel="User relationship actions"
    >
      {/* 1. Primary Follow CTA */}
      <TouchableOpacity
        onPress={onToggleFollow}
        style={[
          styles.followButton,
          A11yStandards.minTouchTarget,
          isFollowing || isRequested
            ? { backgroundColor: theme.card, borderColor: theme.border }
            : { backgroundColor: BrandColors.pink, borderColor: BrandColors.pink },
        ]}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={
          isFollowing
            ? 'Following this user, tap to unfollow'
            : isRequested
            ? 'Follow requested, tap to cancel'
            : 'Follow this user'
        }
      >
        {isRequested ? (
          <Ionicons name="time-outline" size={16} color={BrandColors.cyan} />
        ) : isFollowing ? (
          <Ionicons name="checkmark" size={16} color={theme.text} />
        ) : (
          <Ionicons name="person-add" size={16} color="#FFFFFF" />
        )}
        <Text
          style={[
            styles.followButtonText,
            {
              color: isFollowing ? theme.text : isRequested ? BrandColors.cyan : '#FFFFFF',
              fontSize: typography.fontSize.sm,
            },
          ]}
        >
          {isFollowing ? 'Following' : isRequested ? 'Requested' : 'Follow'}
        </Text>
      </TouchableOpacity>

      {/* 2. Message Action */}
      <TouchableOpacity
        onPress={onMessage}
        style={[
          styles.secondaryButton,
          A11yStandards.minTouchTarget,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Direct message user"
      >
        <Ionicons name="chatbubble-outline" size={16} color={theme.text} />
        <Text style={[styles.actionText, { color: theme.text, fontSize: typography.fontSize.sm }]}>
          Message
        </Text>
      </TouchableOpacity>

      {/* 3. Options Menu */}
      <TouchableOpacity
        onPress={onOptions}
        style={[
          styles.iconOnlyButton,
          A11yStandards.minTouchTarget,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="More profile options"
      >
        <Ionicons name="ellipsis-horizontal" size={18} color={theme.text} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    minHeight: 44,
  },
  actionText: {
    fontWeight: '600',
  },
  followButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    minHeight: 44,
  },
  followButtonText: {
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    minHeight: 44,
  },
  iconOnlyButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
