import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { BrandColors } from '../../theme/colors';
import { Badge } from './Badge';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  title?: string;
  description?: string;
  badgeText?: string;
  actionText?: string;
  onAction?: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Feed Initialized',
  description = 'TikTalk Core Engine is connected and ready. No live videos have been published yet. Be the first creator to upload.',
  badgeText = 'Phase 0 — Foundation',
  actionText,
  onAction,
  iconName = 'film-outline',
}) => {
  const { theme, typography } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name={iconName} size={36} color={BrandColors.cyan} />
      </View>

      <View style={styles.badgeWrapper}>
        <Badge label={badgeText} variant="primary" />
      </View>

      <Text style={[styles.title, { color: theme.text, fontSize: typography.fontSize.lg }]}>
        {title}
      </Text>

      <Text
        style={[
          styles.description,
          { color: theme.textSecondary, fontSize: typography.fontSize.sm, lineHeight: typography.lineHeight.sm },
        ]}
      >
        {description}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    maxWidth: 420,
    alignSelf: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  badgeWrapper: {
    marginBottom: 12,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    fontWeight: '400',
  },
});
