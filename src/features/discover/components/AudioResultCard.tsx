import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { AudioSearchResult } from '../types';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface AudioResultCardProps {
  audio: AudioSearchResult;
  onSelectAudio?: (audio: AudioSearchResult) => void;
}

export const AudioResultCard: React.FC<AudioResultCardProps> = ({
  audio,
  onSelectAudio,
}) => {
  const { theme, typography } = useTheme();

  return (
    <TouchableOpacity
      onPress={() => onSelectAudio?.(audio)}
      style={[
        styles.container,
        { backgroundColor: theme.surface, borderColor: theme.border },
        A11yStandards.minTouchTarget,
      ]}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Audio ${audio.title} by ${audio.artist}`}
    >
      <View style={styles.leftRow}>
        {/* Vinyl / Artwork disc */}
        <View style={styles.discContainer}>
          {audio.artworkUrl ? (
            <Image source={{ uri: audio.artworkUrl }} style={styles.artwork} />
          ) : (
            <View style={styles.discOuter}>
              <View style={styles.discInner}>
                <Ionicons name="musical-notes" size={12} color={BrandColors.cyan} />
              </View>
            </View>
          )}
        </View>

        {/* Title, Artist, Metadata */}
        <View style={styles.info}>
          <Text
            style={[
              styles.audioTitle,
              { color: theme.text, fontSize: typography.fontSize.sm },
            ]}
            numberOfLines={1}
          >
            {audio.title}
          </Text>
          <Text
            style={[
              styles.artist,
              { color: theme.textSecondary, fontSize: typography.fontSize.xs },
            ]}
            numberOfLines={1}
          >
            {audio.artist}
            {audio.durationSeconds > 0 && ` • ${audio.durationSeconds}s`}
          </Text>

          {typeof audio.usageCount === 'number' && (
            <Text
              style={[
                styles.usageCount,
                { color: BrandColors.cyan, fontSize: typography.fontSize.xs },
              ]}
            >
              {audio.usageCount} videos
            </Text>
          )}
        </View>
      </View>

      <Ionicons name="play-circle-outline" size={24} color={BrandColors.pink} />
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
    marginRight: 10,
  },
  discContainer: {
    marginRight: 12,
  },
  discOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    borderWidth: 6,
    borderColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: BrandColors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artwork: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  audioTitle: {
    fontWeight: '700',
  },
  artist: {
    marginTop: 2,
    fontWeight: '500',
  },
  usageCount: {
    marginTop: 2,
    fontWeight: '600',
  },
});
