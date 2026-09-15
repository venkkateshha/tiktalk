import React from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme';
import { AsyncState } from './types';
import { Button } from '../../components/ui/Button';

export interface AsyncBoundaryProps<T> {
  state: AsyncState<T>;
  onRetry?: () => void;
  loadingFallback?: React.ReactNode;
  emptyFallback?: React.ReactNode;
  errorFallback?: (error: Error | string | null, retry?: () => void) => React.ReactNode;
  children: (data: T) => React.ReactNode;
}

export function AsyncBoundary<T>({
  state,
  onRetry,
  loadingFallback,
  emptyFallback,
  errorFallback,
  children,
}: AsyncBoundaryProps<T>): React.ReactElement {
  const { theme, spacing, typography } = useTheme();

  if (state.isLoading) {
    if (loadingFallback) return <>{loadingFallback}</>;
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.background }]}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading content"
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text
          style={[
            styles.statusText,
            {
              color: theme.textSecondary,
              fontSize: typography.fontSize.sm,
              marginTop: spacing.md,
            },
          ]}
        >
          Loading...
        </Text>
      </View>
    );
  }

  if (state.isOffline) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.background }]}
        accessibilityRole="alert"
        accessibilityLabel="Network connection offline"
      >
        <Text style={[styles.title, { color: theme.text, fontSize: typography.fontSize.lg }]}>
          No Internet Connection
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: theme.textSecondary, fontSize: typography.fontSize.sm, marginVertical: spacing.sm },
          ]}
        >
          Please check your network settings and try again.
        </Text>
        {onRetry && (
          <Button
            title="Retry Connection"
            variant="primary"
            size="md"
            onPress={onRetry}
            accessibilityLabel="Retry internet connection"
          />
        )}
      </View>
    );
  }

  if (state.isError) {
    if (errorFallback) return <>{errorFallback(state.error, onRetry)}</>;
    const errorMessage =
      typeof state.error === 'string'
        ? state.error
        : state.error?.message || 'An unexpected error occurred.';

    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.background }]}
        accessibilityRole="alert"
        accessibilityLabel={`Error: ${errorMessage}`}
      >
        <Text style={[styles.title, { color: theme.accent, fontSize: typography.fontSize.lg }]}>
          Something Went Wrong
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: theme.textSecondary, fontSize: typography.fontSize.sm, marginVertical: spacing.sm },
          ]}
        >
          {errorMessage}
        </Text>
        {onRetry && (
          <Button
            title="Try Again"
            variant="outline"
            size="md"
            onPress={onRetry}
            accessibilityLabel="Try loading again"
          />
        )}
      </View>
    );
  }

  if (state.isEmpty || state.data === null) {
    if (emptyFallback) return <>{emptyFallback}</>;
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text, fontSize: typography.fontSize.lg }]}>
          No Content Available
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: theme.textSecondary, fontSize: typography.fontSize.sm, marginTop: spacing.xs },
          ]}
        >
          Check back soon for new updates.
        </Text>
      </View>
    );
  }

  return <>{children(state.data)}</>;
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 200,
  },
  statusText: {
    fontWeight: '500',
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 320,
  },
});
