import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { SearchStatus, SearchCategory } from '../types';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

export interface DiscoverStateViewProps {
  status: SearchStatus;
  query: string;
  category: SearchCategory;
  errorMessage?: string | null;
  onRetry: () => void;
}

export const DiscoverStateView: React.FC<DiscoverStateViewProps> = ({
  status,
  query,
  category,
  errorMessage,
  onRetry,
}) => {
  const { theme, typography, spacing } = useTheme();

  // 1. Loading State
  if (status === 'loading') {
    return (
      <View
        style={styles.container}
        accessible={true}
        accessibilityRole="progressbar"
        accessibilityLabel={`Searching for ${query}`}
      >
        <ActivityIndicator size="large" color={BrandColors.cyan} />
        <Text
          style={[
            styles.stateText,
            { color: theme.textSecondary, fontSize: typography.fontSize.sm, marginTop: spacing.md },
          ]}
        >
          Searching TikTalk Index...
        </Text>
      </View>
    );
  }

  // 2. Offline State
  if (status === 'offline') {
    return (
      <View
        style={styles.container}
        accessible={true}
        accessibilityRole="alert"
        accessibilityLabel="Internet connection lost"
      >
        <View style={[styles.iconCircle, { borderColor: theme.border }]}>
          <Ionicons name="cloud-offline-outline" size={38} color={BrandColors.white} />
        </View>
        <Badge label="OFFLINE" variant="neutral" />
        <Text
          style={[
            styles.title,
            { color: theme.text, fontSize: typography.fontSize.lg, marginTop: 12 },
          ]}
        >
          No Internet Connection
        </Text>
        <Text
          style={[
            styles.desc,
            { color: theme.textSecondary, fontSize: typography.fontSize.sm, marginVertical: spacing.sm },
          ]}
        >
          {errorMessage || 'Connect to the internet to search creators, videos, hashtags, and sounds.'}
        </Text>
        <Button
          label="Retry Search"
          variant="primary"
          size="md"
          onPress={onRetry}
          accessibilityLabel="Retry search network request"
        />
      </View>
    );
  }

  // 3. Unavailable State
  if (status === 'unavailable') {
    return (
      <View
        style={styles.container}
        accessible={true}
        accessibilityRole="alert"
        accessibilityLabel="Search service unavailable"
      >
        <View style={[styles.iconCircle, { borderColor: theme.border }]}>
          <Ionicons name="server-outline" size={38} color={BrandColors.pink} />
        </View>
        <Badge label="SERVICE STATUS" variant="accent" />
        <Text
          style={[
            styles.title,
            { color: theme.text, fontSize: typography.fontSize.lg, marginTop: 12 },
          ]}
        >
          Search Service Unavailable
        </Text>
        <Text
          style={[
            styles.desc,
            { color: theme.textSecondary, fontSize: typography.fontSize.sm, marginVertical: spacing.sm },
          ]}
        >
          {errorMessage || 'The global search cluster is currently unreachable. Our engineers are monitoring.'}
        </Text>
        <Button
          label="Check Again"
          variant="outline"
          size="md"
          onPress={onRetry}
          accessibilityLabel="Retry search connection"
        />
      </View>
    );
  }

  // 4. Error State
  if (status === 'error') {
    return (
      <View
        style={styles.container}
        accessible={true}
        accessibilityRole="alert"
        accessibilityLabel="Search error occurred"
      >
        <View style={[styles.iconCircle, { borderColor: theme.border }]}>
          <Ionicons name="alert-circle-outline" size={38} color={BrandColors.pink} />
        </View>
        <Text
          style={[
            styles.title,
            { color: theme.text, fontSize: typography.fontSize.lg, marginTop: 12 },
          ]}
        >
          Search Request Failed
        </Text>
        <Text
          style={[
            styles.desc,
            { color: theme.textSecondary, fontSize: typography.fontSize.sm, marginVertical: spacing.sm },
          ]}
        >
          {errorMessage || 'An error occurred while executing search. Please try again.'}
        </Text>
        <Button
          label="Try Again"
          variant="primary"
          size="md"
          onPress={onRetry}
          accessibilityLabel="Retry search"
        />
      </View>
    );
  }

  // 5. Empty State (Query returned 0 results)
  if (status === 'empty' && query.trim()) {
    return (
      <View
        style={styles.container}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={`No results found for "${query}"`}
      >
        <View style={[styles.iconCircle, { borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={38} color={theme.textSecondary} />
        </View>
        <Text
          style={[
            styles.title,
            { color: theme.text, fontSize: typography.fontSize.lg },
          ]}
        >
          No Results Found
        </Text>
        <Text
          style={[
            styles.desc,
            { color: theme.textSecondary, fontSize: typography.fontSize.sm, marginVertical: spacing.sm },
          ]}
        >
          No matching {category === 'all' ? 'content' : category} found for &quot;{query}&quot;. Try checking for typos or searching for a different keyword.
        </Text>
      </View>
    );
  }

  // 6. Initial State (Discover Introduction — zero fake business data)
  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel="Discover creators, videos, hashtags, and sounds on TikTalk"
    >
      <View style={[styles.iconCircle, { borderColor: theme.border }]}>
        <Ionicons name="compass-outline" size={40} color={BrandColors.cyan} />
      </View>

      <Badge label="DISCOVERY ENGINE READY" variant="primary" />

      <Text
        style={[
          styles.title,
          { color: theme.text, fontSize: typography.fontSize.lg, marginTop: 12 },
        ]}
      >
        Discover on TikTalk
      </Text>

      <Text
        style={[
          styles.desc,
          { color: theme.textSecondary, fontSize: typography.fontSize.sm, marginVertical: spacing.sm },
        ]}
      >
        Search for your favorite creators, viral 60 FPS shorts, trending hashtags, and original sounds.
      </Text>

      <View style={[styles.engineCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.engineTitle, { color: theme.text, fontSize: typography.fontSize.xs }]}>
          Architecture Specifications
        </Text>
        <Text style={[styles.engineDesc, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]}>
          Distributed Inverted Index • Sub-50ms Search SLA • Full-Text Match
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  stateText: {
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
  },
  desc: {
    textAlign: 'center',
    maxWidth: 340,
    lineHeight: 19,
  },
  engineCard: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 16,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
  },
  engineTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  engineDesc: {
    textAlign: 'center',
  },
});
