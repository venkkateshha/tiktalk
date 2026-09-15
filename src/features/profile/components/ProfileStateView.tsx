import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { ProfileStatus } from '../types';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface ProfileStateViewProps {
  status: ProfileStatus;
  errorMessage?: string | null;
  onRetry?: () => void;
}

export const ProfileStateView: React.FC<ProfileStateViewProps> = ({
  status,
  errorMessage,
  onRetry,
}) => {
  const { theme, typography } = useTheme();

  if (status === 'success' || status === 'empty') {
    return null;
  }

  if (status === 'loading') {
    return (
      <View
        style={styles.container}
        accessible={true}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading profile"
      >
        <ActivityIndicator size="large" color={BrandColors.cyan} />
        <Text style={[styles.stateText, { color: theme.textSecondary, fontSize: typography.fontSize.sm }]}>
          Loading profile...
        </Text>
      </View>
    );
  }

  if (status === 'private_locked') {
    return (
      <View
        style={styles.container}
        accessible={true}
        accessibilityRole="none"
        accessibilityLabel="Private account notice"
      >
        <View style={[styles.iconCircle, { backgroundColor: theme.card }]}>
          <Ionicons name="lock-closed-outline" size={44} color={BrandColors.cyan} />
        </View>
        <Text style={[styles.stateTitle, { color: theme.text, fontSize: typography.fontSize.lg }]}>
          This Account is Private
        </Text>
        <Text style={[styles.stateText, { color: theme.textSecondary, fontSize: typography.fontSize.sm }]}>
          Follow this account to see their 60 FPS videos, liked shorts, and creator activity.
        </Text>
      </View>
    );
  }

  const isOffline = status === 'offline';

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel="Profile error state"
    >
      <View style={[styles.iconCircle, { backgroundColor: theme.card }]}>
        <Ionicons
          name={isOffline ? 'cloud-offline-outline' : 'alert-circle-outline'}
          size={44}
          color={BrandColors.pink}
        />
      </View>
      <Text style={[styles.stateTitle, { color: theme.text, fontSize: typography.fontSize.lg }]}>
        {isOffline ? 'You Are Offline' : 'Profile Unavailable'}
      </Text>
      <Text style={[styles.stateText, { color: theme.textSecondary, fontSize: typography.fontSize.sm }]}>
        {errorMessage ||
          (isOffline
            ? 'Connect to the internet to view this creator profile.'
            : 'Unable to connect to the profile service. Please try again.')}
      </Text>

      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          style={[styles.retryBtn, A11yStandards.minTouchTarget, { backgroundColor: BrandColors.cyan }]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Retry loading profile"
        >
          <Ionicons name="refresh" size={18} color="#000000" />
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
    gap: 12,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stateTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  stateText: {
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
    minHeight: 44,
  },
  retryBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
});
