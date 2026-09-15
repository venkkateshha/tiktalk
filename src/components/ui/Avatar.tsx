import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: AvatarSize;
  hasStory?: boolean;
  isStoryViewed?: boolean;
  isVerified?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name = 'User',
  size = 'md',
  hasStory = false,
  isStoryViewed = false,
  isVerified = false,
  onPress,
  style,
}) => {
  const { theme, brandColors } = useTheme();

  const getDimensions = () => {
    switch (size) {
      case 'xs':
        return { dimension: 28, fontSize: 11, badgeSize: 10 };
      case 'sm':
        return { dimension: 36, fontSize: 13, badgeSize: 12 };
      case 'lg':
        return { dimension: 64, fontSize: 22, badgeSize: 18 };
      case 'xl':
        return { dimension: 88, fontSize: 32, badgeSize: 22 };
      case 'md':
      default:
        return { dimension: 48, fontSize: 16, badgeSize: 14 };
    }
  };

  const { dimension, fontSize, badgeSize } = getDimensions();
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const getRingColor = () => {
    if (!hasStory) return 'transparent';
    if (isStoryViewed) return theme.textMuted;
    return brandColors.cyan; // TikTalk active story ring accent
  };

  const ringPadding = hasStory ? 2.5 : 0;
  const ringWidth = hasStory ? 2 : 0;

  const content = (
    <View
      style={[
        styles.ringWrapper,
        {
          width: dimension + ringPadding * 2 + ringWidth * 2,
          height: dimension + ringPadding * 2 + ringWidth * 2,
          borderRadius: 9999,
          borderColor: getRingColor(),
          borderWidth: ringWidth,
          padding: ringPadding,
        },
        style,
      ]}
      accessible={true}
      accessibilityRole={onPress ? 'button' : 'image'}
      accessibilityLabel={`${name}'s avatar${hasStory ? ', has active story' : ''}`}
    >
      <View
        style={[
          styles.innerContainer,
          {
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
            backgroundColor: theme.surface,
          },
        ]}
      >
        {source ? (
          <Image
            source={{ uri: source }}
            style={{ width: dimension, height: dimension, borderRadius: dimension / 2 }}
            resizeMode="cover"
          />
        ) : (
          <Text style={[styles.initials, { fontSize, color: theme.text }]}>
            {initials || '?'}
          </Text>
        )}
      </View>

      {/* Verified Creator Badge */}
      {isVerified && (
        <View
          style={[
            styles.verifiedBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: brandColors.cyan,
              borderColor: theme.background,
            },
          ]}
        >
          <Ionicons name="checkmark" size={badgeSize * 0.75} color={brandColors.black} />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.touchable}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  touchable: {
    alignSelf: 'flex-start',
  },
  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  innerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    fontWeight: '700',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
