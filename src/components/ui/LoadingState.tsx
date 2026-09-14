import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme';
import { BrandColors } from '../../theme/colors';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Connecting to TikTalk Engine...' }) => {
  const { theme, typography } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.pulseContainer}>
        <ActivityIndicator size="large" color={BrandColors.cyan} />
      </View>
      <Text style={[styles.text, { color: theme.textSecondary, fontSize: typography.fontSize.sm }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  pulseContainer: {
    marginBottom: 16,
  },
  text: {
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
