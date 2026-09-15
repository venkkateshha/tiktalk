import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Avatar } from './Avatar';

export interface StorySummary {
  userId: string;
  username: string;
  avatarUrl?: string;
  hasUnseenStories: boolean;
  isCurrentUser?: boolean;
}

export interface StoriesRailProps {
  stories?: StorySummary[];
  userHasStory?: boolean;
  onSelectStory?: (story: StorySummary) => void;
  onAddStory?: () => void;
  onViewUserStory?: () => void;
}

export const StoriesRail: React.FC<StoriesRailProps> = ({
  stories = [],
  userHasStory = false,
  onSelectStory,
  onAddStory,
  onViewUserStory,
}) => {
  const { theme, typography, spacing, brandColors } = useTheme();

  return (
    <View
      style={[styles.container, { borderBottomColor: theme.border }]}
      accessible={true}
      accessibilityRole="list"
      accessibilityLabel="Stories row"
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Your Story / Add Story Slot */}
        <TouchableOpacity
          onPress={() => {
            if (userHasStory && onViewUserStory) {
              onViewUserStory();
            } else {
              onAddStory?.();
            }
          }}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={userHasStory ? "View your story" : "Add to your story"}
          style={styles.storyItem}
        >
          <View style={styles.addStoryAvatarWrapper}>
            <Avatar
              name="You"
              size="md"
              hasStory={userHasStory}
              isStoryViewed={false}
            />
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                onAddStory?.();
              }}
              style={[
                styles.addBadge,
                { backgroundColor: brandColors.cyan, borderColor: theme.background },
              ]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Add new story"
            >
              <Ionicons name="add" size={14} color={brandColors.black} />
            </TouchableOpacity>
          </View>
          <Text
            numberOfLines={1}
            style={[styles.usernameText, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]}
          >
            Your Story
          </Text>
        </TouchableOpacity>

        {/* Stories list from creators */}
        {stories.map((story) => (
          <TouchableOpacity
            key={story.userId}
            onPress={() => onSelectStory?.(story)}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`${story.username}'s story`}
            style={styles.storyItem}
          >
            <Avatar
              source={story.avatarUrl}
              name={story.username}
              size="md"
              hasStory={true}
              isStoryViewed={!story.hasUnseenStories}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.usernameText,
                {
                  color: story.hasUnseenStories ? theme.text : theme.textSecondary,
                  fontSize: typography.fontSize.xs,
                  fontWeight: story.hasUnseenStories ? '600' : '400',
                },
              ]}
            >
              {story.username}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  storyItem: {
    alignItems: 'center',
    width: 64,
  },
  addStoryAvatarWrapper: {
    position: 'relative',
  },
  addBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  usernameText: {
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 60,
  },
});
