import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { FeedFilter, FeedStatus } from '../types';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

export interface FeedStateViewProps {
  status: FeedStatus;
  filter: FeedFilter;
  errorMessage?: string | null;
  onRetry: () => void;
}

export const FeedStateView: React.FC<FeedStateViewProps> = ({
  status,
  filter,
  errorMessage,
  onRetry,
}) => {
  const { theme, typography, spacing } = useTheme();

  if (status === 'loading') {
    return (
      <View
        style={[styles.container, { backgroundColor: BrandColors.black }]}
        accessible={true}
        accessibilityRole="progressbar"
        accessibilityLabel={`Loading ${filter === 'forYou' ? 'For You' : 'Following'} feed`}
      >
        <ActivityIndicator size="large" color={BrandColors.cyan} />
        <Text
          style={[
            styles.loadingText,
            { color: BrandColors.darkTextSecondary, fontSize: typography.fontSize.sm, marginTop: spacing.md },
          ]}
        >
          Connecting to TikTalk Edge...
        </Text>
      </View>
    );
  }

  if (status === 'offline') {
    return (
      <View
        style={[styles.container, { backgroundColor: BrandColors.black }]}
        accessible={true}
        accessibilityRole="alert"
        accessibilityLabel="Internet connection lost"
      >
        <View style={styles.iconCircle}>
          <Ionicons name="cloud-offline-outline" size={40} color={BrandColors.white} />
        </View>
        <Badge label="OFFLINE" variant="neutral" />
        <Text style={[styles.title, { color: BrandColors.white, fontSize: typography.fontSize.lg, marginTop: 12 }]}>
          No Internet Connection
        </Text>
        <Text
          style={[
            styles.desc,
            { color: BrandColors.darkTextSecondary, fontSize: typography.fontSize.sm, marginVertical: spacing.sm },
          ]}
        >
          Please check your network settings. Once back online, the feed will resume automatically.
        </Text>
        <Button
          label="Retry Network"
          variant="primary"
          size="md"
          onPress={onRetry}
          accessibilityLabel="Retry internet connection"
        />
      </View>
    );
  }

  if (status === 'unavailable') {
    return (
      <View
        style={[styles.container, { backgroundColor: BrandColors.black }]}
        accessible={true}
        accessibilityRole="alert"
        accessibilityLabel="Feed service unavailable"
      >
        <View style={styles.iconCircle}>
          <Ionicons name="server-outline" size={40} color={BrandColors.pink} />
        </View>
        <Badge label="SERVICE STATUS" variant="accent" />
        <Text style={[styles.title, { color: BrandColors.white, fontSize: typography.fontSize.lg, marginTop: 12 }]}>
          Feed Service Unavailable
        </Text>
        <Text
          style={[
            styles.desc,
            { color: BrandColors.darkTextSecondary, fontSize: typography.fontSize.sm, marginVertical: spacing.sm },
          ]}
        >
          {errorMessage || 'The feed streaming cluster is currently unreachable. Our engineers are monitoring.'}
        </Text>
        <Button
          label="Check Again"
          variant="outline"
          size="md"
          onPress={onRetry}
          accessibilityLabel="Retry fetching feed"
        />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View
        style={[styles.container, { backgroundColor: BrandColors.black }]}
        accessible={true}
        accessibilityRole="alert"
        accessibilityLabel="Feed error occurred"
      >
        <View style={styles.iconCircle}>
          <Ionicons name="alert-circle-outline" size={40} color={BrandColors.pink} />
        </View>
        <Text style={[styles.title, { color: BrandColors.white, fontSize: typography.fontSize.lg, marginTop: 12 }]}>
          Unable to Load Feed
        </Text>
        <Text
          style={[
            styles.desc,
            { color: BrandColors.darkTextSecondary, fontSize: typography.fontSize.sm, marginVertical: spacing.sm },
          ]}
        >
          {errorMessage || 'An error occurred while loading content. Please try again.'}
        </Text>
        <Button
          label="Try Again"
          variant="primary"
          size="md"
          onPress={onRetry}
          accessibilityLabel="Retry loading feed"
        />
      </View>
    );
  }

  // Polished Empty State (Default when no real items exist yet)
  return (
    <View
      style={[styles.container, { backgroundColor: BrandColors.black }]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`No videos in ${filter === 'forYou' ? 'For You' : 'Following'} feed yet`}
    >
      <View style={[styles.iconCircle, { borderColor: BrandColors.darkBorder }]}>
        <Ionicons
          name={filter === 'forYou' ? 'flame-outline' : 'people-outline'}
          size={38}
          color={BrandColors.cyan}
        />
      </View>

      <View style={styles.badgeRow}>
        <Badge
          label={filter === 'forYou' ? 'FOR YOU ENGINE READY' : 'FOLLOWING READY'}
          variant="primary"
        />
      </View>

      <Text style={[styles.title, { color: BrandColors.white, fontSize: typography.fontSize.lg }]}>
        {filter === 'forYou' ? 'For You Feed Initialized' : 'Following Feed Ready'}
      </Text>

      <Text
        style={[
          styles.desc,
          { color: BrandColors.darkTextSecondary, fontSize: typography.fontSize.sm, marginVertical: spacing.sm },
        ]}
      >
        {filter === 'forYou'
          ? 'The TikTalk High-Performance 60 FPS video player is connected to the Cloudflare R2 streaming edge. No videos have been published yet.'
          : 'Follow creators to see their latest 60 FPS shorts here. Your following feed will update in real-time.'}
      </Text>

      <View style={styles.engineMetaCard}>
        <Text style={[styles.metaTitle, { color: BrandColors.white, fontSize: typography.fontSize.xs }]}>
          Architecture Specifications
        </Text>
        <Text style={[styles.metaDetail, { color: BrandColors.darkTextSecondary, fontSize: typography.fontSize.xs }]}>
          Adaptive HLS • WebRTC P2P Swarm • 60% Creator Rev-Share
        </Text>
      </View>

      <Button
        label="Refresh Feed"
        variant="outline"
        size="sm"
        onPress={onRetry}
        style={{ marginTop: 16 }}
        accessibilityLabel="Refresh feed"
      />
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
    paddingVertical: 32,
  },
  loadingText: {
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: BrandColors.darkBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  badgeRow: {
    marginBottom: 8,
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
  engineMetaCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: BrandColors.darkBorder,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 8,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
  },
  metaTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  metaDetail: {
    textAlign: 'center',
  },
});
