import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { CreatorSearchResult } from '../types';
import { Avatar } from '../../../components/ui/Avatar';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface CreatorResultCardProps {
  creator: CreatorSearchResult;
  onSelectCreator?: (creator: CreatorSearchResult) => void;
  onToggleFollow?: (creator: CreatorSearchResult) => void;
}

export const CreatorResultCard: React.FC<CreatorResultCardProps> = ({
  creator,
  onSelectCreator,
  onToggleFollow,
}) => {
  const { theme, typography } = useTheme();

  const isVerified =
    creator.verificationStatus === 'verified' ||
    creator.verificationStatus === 'creator';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel={`Creator ${creator.displayName} @${creator.username}`}
    >
      {/* Avatar & Names Row */}
      <TouchableOpacity
        onPress={() => onSelectCreator?.(creator)}
        style={styles.creatorInfoTouch}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`View ${creator.displayName}'s profile`}
      >
        <Avatar
          source={creator.avatarUrl}
          name={creator.displayName}
          size="md"
          isVerified={isVerified}
        />
        <View style={styles.textContainer}>
          <View style={styles.nameRow}>
            <Text
              style={[
                styles.displayName,
                { color: theme.text, fontSize: typography.fontSize.sm },
              ]}
              numberOfLines={1}
            >
              {creator.displayName}
            </Text>
            {isVerified && (
              <View style={styles.verifiedIcon}>
                <Ionicons name="checkmark" size={10} color={BrandColors.black} />
              </View>
            )}
          </View>

          <Text
            style={[
              styles.handle,
              { color: theme.textSecondary, fontSize: typography.fontSize.xs },
            ]}
            numberOfLines={1}
          >
            @{creator.username}
          </Text>

          {creator.bio ? (
            <Text
              style={[
                styles.bio,
                { color: theme.textSecondary, fontSize: typography.fontSize.xs },
              ]}
              numberOfLines={1}
            >
              {creator.bio}
            </Text>
          ) : null}

          {typeof creator.followerCount === 'number' && (
            <Text
              style={[
                styles.followers,
                { color: BrandColors.cyan, fontSize: typography.fontSize.xs },
              ]}
            >
              {creator.followerCount} followers
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Follow CTA */}
      <TouchableOpacity
        onPress={() => onToggleFollow?.(creator)}
        style={[
          styles.followButton,
          A11yStandards.minTouchTarget,
          creator.isFollowing
            ? { backgroundColor: 'transparent', borderColor: theme.border }
            : { backgroundColor: BrandColors.cyan, borderColor: BrandColors.cyan },
        ]}
        activeOpacity={0.8}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={
          creator.isFollowing
            ? `Unfollow ${creator.displayName}`
            : `Follow ${creator.displayName}`
        }
        accessibilityState={{ selected: creator.isFollowing }}
      >
        <Text
          style={[
            styles.followButtonText,
            {
              color: creator.isFollowing ? theme.text : BrandColors.black,
              fontSize: typography.fontSize.xs,
            },
          ]}
        >
          {creator.isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  creatorInfoTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  displayName: {
    fontWeight: '700',
  },
  verifiedIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: BrandColors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  handle: {
    fontWeight: '500',
    marginTop: 2,
  },
  bio: {
    marginTop: 2,
  },
  followers: {
    fontWeight: '600',
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButtonText: {
    fontWeight: '700',
  },
});
