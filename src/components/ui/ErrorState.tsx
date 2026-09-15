import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Button } from './Button';
import { Badge } from './Badge';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  isOffline?: boolean;
  onRetry?: () => void;
  retryButtonText?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  isOffline = false,
  onRetry,
  retryButtonText = 'Retry',
}) => {
  const { theme, typography, spacing, brandColors } = useTheme();

  const resolvedTitle = title || (isOffline ? 'Connection Lost' : 'Unable to Load Content');
  const resolvedMessage =
    message ||
    (isOffline
      ? 'TikTalk requires an active internet connection. Please check your network and try again.'
      : 'An unexpected issue occurred while fetching this content. Please try again.');

  return (
    <View
      style={[styles.container, { backgroundColor: theme.background }]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={`${resolvedTitle}: ${resolvedMessage}`}
    >
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: theme.surface,
            borderColor: isOffline ? theme.border : brandColors.pink,
          },
        ]}
      >
        <Ionicons
          name={isOffline ? 'cloud-offline-outline' : 'alert-circle-outline'}
          size={36}
          color={isOffline ? theme.textSecondary : brandColors.pink}
        />
      </View>

      {isOffline && (
        <View style={styles.badgeSlot}>
          <Badge label="Offline Mode" variant="neutral" />
        </View>
      )}

      <Text style={[styles.title, { color: theme.text, fontSize: typography.fontSize.lg }]}>
        {resolvedTitle}
      </Text>

      <Text
        style={[
          styles.message,
          {
            color: theme.textSecondary,
            fontSize: typography.fontSize.sm,
            lineHeight: typography.lineHeight.sm,
            marginBottom: spacing.lg,
          },
        ]}
      >
        {resolvedMessage}
      </Text>

      {onRetry && (
        <Button
          label={retryButtonText}
          variant={isOffline ? 'primary' : 'outline'}
          size="md"
          onPress={onRetry}
          accessibilityLabel="Retry loading content"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    maxWidth: 400,
    alignSelf: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  badgeSlot: {
    marginBottom: 8,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
  },
});
