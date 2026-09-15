import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { HashtagSearchResult } from '../types';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface HashtagResultCardProps {
  hashtag: HashtagSearchResult;
  onSelectHashtag?: (hashtag: HashtagSearchResult) => void;
}

export const HashtagResultCard: React.FC<HashtagResultCardProps> = ({
  hashtag,
  onSelectHashtag,
}) => {
  const { theme, typography } = useTheme();

  const formattedTag = hashtag.tag.startsWith('#') ? hashtag.tag : `#${hashtag.tag}`;

  return (
    <TouchableOpacity
      onPress={() => onSelectHashtag?.(hashtag)}
      style={[
        styles.container,
        { backgroundColor: theme.surface, borderColor: theme.border },
        A11yStandards.minTouchTarget,
      ]}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Hashtag ${formattedTag}${
        typeof hashtag.contentCount === 'number'
          ? `, ${hashtag.contentCount} videos`
          : ''
      }`}
    >
      <View style={styles.leftRow}>
        <View style={[styles.hashCircle, { backgroundColor: theme.card }]}>
          <Ionicons name="pricetag-outline" size={16} color={BrandColors.cyan} />
        </View>
        <View style={styles.info}>
          <Text
            style={[
              styles.tagTitle,
              { color: theme.text, fontSize: typography.fontSize.sm },
            ]}
          >
            {formattedTag}
          </Text>
          {typeof hashtag.contentCount === 'number' && (
            <Text
              style={[
                styles.tagCount,
                { color: theme.textSecondary, fontSize: typography.fontSize.xs },
              ]}
            >
              {hashtag.contentCount} videos
            </Text>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  hashCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    justifyContent: 'center',
  },
  tagTitle: {
    fontWeight: '700',
  },
  tagCount: {
    marginTop: 2,
    fontWeight: '500',
  },
});
