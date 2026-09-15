import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { VideoSearchResult } from '../types';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface VideoGridCardProps {
  video: VideoSearchResult;
  onSelectVideo?: (video: VideoSearchResult) => void;
}

export const VideoGridCard: React.FC<VideoGridCardProps> = ({
  video,
  onSelectVideo,
}) => {
  const { typography } = useTheme();

  return (
    <TouchableOpacity
      onPress={() => onSelectVideo?.(video)}
      style={[styles.container, A11yStandards.minTouchTarget]}
      activeOpacity={0.8}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Video by ${video.creator?.displayName || 'Creator'}: ${video.caption || 'Short video'}`}
    >
      {/* 9:16 Media Canvas */}
      <View style={styles.mediaContainer}>
        {video.thumbnailUrl ? (
          <Image
            source={{ uri: video.thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.fallbackCanvas}>
            <Ionicons name="play" size={24} color={BrandColors.cyan} />
          </View>
        )}

        {/* Duration / View Count Badge */}
        <View style={styles.topBadgeRow}>
          {typeof video.viewCount === 'number' && (
            <View style={styles.viewBadge}>
              <Ionicons name="eye-outline" size={12} color={BrandColors.white} />
              <Text style={styles.viewText}>{video.viewCount}</Text>
            </View>
          )}
        </View>

        {/* Bottom Overlay: Caption and Creator handle */}
        <View style={styles.bottomOverlay}>
          <Text
            style={[
              styles.caption,
              { fontSize: typography.fontSize.xs, color: BrandColors.white },
            ]}
            numberOfLines={2}
          >
            {video.caption || 'TikTalk Video'}
          </Text>
          <Text
            style={[
              styles.creatorHandle,
              { fontSize: typography.fontSize.xs, color: BrandColors.darkTextSecondary },
            ]}
            numberOfLines={1}
          >
            @{video.creator?.username || 'creator'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaContainer: {
    width: '100%',
    aspectRatio: 9 / 16,
    backgroundColor: '#1A1A1A',
    position: 'relative',
    justifyContent: 'space-between',
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  fallbackCanvas: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
  },
  topBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 6,
    zIndex: 2,
  },
  viewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  viewText: {
    color: BrandColors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  bottomOverlay: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 2,
  },
  caption: {
    fontWeight: '600',
    lineHeight: 14,
    marginBottom: 2,
  },
  creatorHandle: {
    fontWeight: '500',
  },
});
