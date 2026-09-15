import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { Story } from '../types';

export interface StoryMediaViewProps {
  story: Story;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const StoryMediaView: React.FC<StoryMediaViewProps> = ({
  story,
  isMuted,
  onToggleMute,
}) => {
  const { brandColors, typography } = useTheme();

  const renderContent = () => {
    switch (story.type) {
      case 'photo':
        return (
          <View style={styles.mediaContainer}>
            {story.media?.uri ? (
              <Image
                source={{ uri: story.media.uri }}
                style={styles.fullMedia}
                resizeMode="cover"
                accessible={true}
                accessibilityRole="image"
                accessibilityLabel="Story photo"
              />
            ) : (
              <View style={[styles.fallbackContainer, { backgroundColor: '#18181B' }]}>
                <Ionicons name="image-outline" size={64} color="rgba(255,255,255,0.4)" />
                <Text style={[styles.fallbackText, { color: 'rgba(255,255,255,0.6)' }]}>
                  Photo Story
                </Text>
              </View>
            )}
          </View>
        );

      case 'video':
        return (
          <View style={styles.mediaContainer}>
            {story.media?.uri ? (
              <Image
                source={{ uri: story.media.uri }}
                style={styles.fullMedia}
                resizeMode="cover"
                accessible={true}
                accessibilityRole="image"
                accessibilityLabel="Story video preview"
              />
            ) : (
              <View style={[styles.fallbackContainer, { backgroundColor: '#09090B' }]}>
                <Ionicons name="videocam-outline" size={64} color={brandColors.cyan} />
                <Text style={[styles.fallbackText, { color: brandColors.white }]}>
                  Video Story
                </Text>
              </View>
            )}

            {/* Audio Mute/Unmute Overlay Toggle */}
            <TouchableOpacity
              onPress={onToggleMute}
              style={styles.muteButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={isMuted ? 'Unmute story audio' : 'Mute story audio'}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isMuted ? 'volume-mute' : 'volume-high'}
                size={20}
                color={brandColors.white}
              />
            </TouchableOpacity>
          </View>
        );

      case 'text':
      default:
        const bg = story.textBackground || brandColors.black;
        return (
          <View
            style={[
              styles.textStoryContainer,
              { backgroundColor: bg },
            ]}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={`Text story: ${story.textContent}`}
          >
            <View style={styles.textStoryCard}>
              <Text
                style={[
                  styles.textContent,
                  {
                    color: brandColors.white,
                    fontSize: typography.fontSize.xl,
                  },
                ]}
              >
                {story.textContent}
              </Text>

              {/* Mentions chips if any */}
              {story.mentions && story.mentions.length > 0 && (
                <View style={styles.mentionsRow}>
                  {story.mentions.map((mention, idx) => (
                    <View
                      key={idx}
                      style={[styles.mentionChip, { backgroundColor: 'rgba(37, 244, 238, 0.2)' }]}
                    >
                      <Text style={[styles.mentionText, { color: brandColors.cyan }]}>
                        {mention}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderContent()}

      {/* Overlays / Stickers if present */}
      {story.stickers && story.stickers.length > 0 && (
        <View style={styles.overlayLayer} pointerEvents="none">
          {story.stickers.map((st) => (
            <View
              key={st.id}
              style={[
                styles.stickerBubble,
                { left: `${st.position.x}%`, top: `${st.position.y}%` },
              ]}
            >
              <Text style={styles.stickerValue}>{st.value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullMedia: {
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  fallbackText: {
    fontSize: 16,
    fontWeight: '600',
  },
  muteButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textStoryContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  textStoryCard: {
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 34,
  },
  mentionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 20,
    justifyContent: 'center',
  },
  mentionChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mentionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  overlayLayer: {
    ...StyleSheet.absoluteFill,
  },
  stickerBubble: {
    position: 'absolute',
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  stickerValue: {
    fontSize: 24,
  },
});
