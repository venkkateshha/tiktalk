import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { UserProfile } from '../types';
import { Avatar } from '../../../components/ui/Avatar';
import { VerificationBadge } from './VerificationBadge';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface ProfileHeaderViewProps {
  profile: UserProfile;
  hasActiveStory?: boolean;
  onOpenStory?: () => void;
  onOpenFollowers?: () => void;
  onOpenFollowing?: () => void;
}

export const ProfileHeaderView: React.FC<ProfileHeaderViewProps> = ({
  profile,
  hasActiveStory = false,
  onOpenStory,
  onOpenFollowers,
  onOpenFollowing,
}) => {
  const { theme, typography } = useTheme();

  const handlePressWebsite = () => {
    if (profile.website) {
      Linking.openURL(profile.website).catch(() => {});
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1_000_000) {
      return `${(count / 1_000_000).toFixed(1)}M`;
    }
    if (count >= 1_000) {
      return `${(count / 1_000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel={`Profile header for ${profile.displayName}`}
    >
      {/* 1. Avatar & Story Ring */}
      <View style={styles.avatarSection}>
        <Avatar
          name={profile.displayName}
          source={profile.avatarUrl}
          size="xl"
          hasStory={hasActiveStory}
          isStoryViewed={false}
          isVerified={profile.verificationStatus === 'verified'}
          onPress={hasActiveStory ? onOpenStory : undefined}
        />
      </View>

      {/* 2. Display Name & Verification Badge */}
      <View style={styles.nameRow}>
        <Text
          style={[styles.displayName, { color: theme.text, fontSize: typography.fontSize.xl }]}
          numberOfLines={1}
        >
          {profile.displayName}
        </Text>
        <VerificationBadge status={profile.verificationStatus} size={18} />
      </View>

      {/* 3. Handle / Username */}
      <Text style={[styles.handle, { color: theme.textSecondary, fontSize: typography.fontSize.sm }]}>
        @{profile.username}
      </Text>

      {/* 4. Creator Category Pill */}
      {profile.isCreator && profile.category && (
        <View style={[styles.categoryPill, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.categoryText, { color: BrandColors.cyan, fontSize: typography.fontSize.xs }]}>
            {profile.category}
          </Text>
        </View>
      )}

      {/* 5. Stats Row (Following, Followers, Likes) */}
      <View style={[styles.statsRow, { borderColor: theme.border }]}>
        <TouchableOpacity
          onPress={onOpenFollowing}
          style={[styles.statItem, A11yStandards.minTouchTarget]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`${formatCount(profile.followingCount)} following, tap to view list`}
        >
          <Text style={[styles.statValue, { color: theme.text, fontSize: typography.fontSize.lg }]}>
            {formatCount(profile.followingCount)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]}>
            Following
          </Text>
        </TouchableOpacity>

        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

        <TouchableOpacity
          onPress={onOpenFollowers}
          style={[styles.statItem, A11yStandards.minTouchTarget]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`${formatCount(profile.followersCount)} followers, tap to view list`}
        >
          <Text style={[styles.statValue, { color: theme.text, fontSize: typography.fontSize.lg }]}>
            {formatCount(profile.followersCount)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]}>
            Followers
          </Text>
        </TouchableOpacity>

        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

        <View
          style={[styles.statItem, A11yStandards.minTouchTarget]}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={`${formatCount(profile.likesCount)} total likes received`}
        >
          <Text style={[styles.statValue, { color: theme.text, fontSize: typography.fontSize.lg }]}>
            {formatCount(profile.likesCount)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]}>
            Likes
          </Text>
        </View>
      </View>

      {/* 6. Bio Text */}
      {profile.bio ? (
        <Text style={[styles.bio, { color: theme.text, fontSize: typography.fontSize.sm }]}>
          {profile.bio}
        </Text>
      ) : null}

      {/* 7. Website Link */}
      {profile.website ? (
        <TouchableOpacity
          onPress={handlePressWebsite}
          style={[styles.websiteRow, A11yStandards.minTouchTarget]}
          accessible={true}
          accessibilityRole="link"
          accessibilityLabel={`Website: ${profile.website}`}
        >
          <Ionicons name="link-outline" size={14} color={BrandColors.cyan} />
          <Text
            style={[styles.websiteText, { color: BrandColors.cyan, fontSize: typography.fontSize.xs }]}
            numberOfLines={1}
          >
            {profile.website.replace(/^https?:\/\//, '')}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  avatarSection: {
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  displayName: {
    fontWeight: '800',
  },
  handle: {
    marginTop: 2,
    fontWeight: '500',
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  categoryText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    marginVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  statValue: {
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  bio: {
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
    maxWidth: 320,
  },
  websiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  websiteText: {
    fontWeight: '600',
  },
});
