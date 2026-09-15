import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors } from '../../../theme/colors';
import { MediaAsset } from '../types';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface VideoPreviewPlayerProps {
  asset: MediaAsset;
  playbackSpeed?: number;
  isMuted?: boolean;
  trimStartSeconds?: number;
  trimEndSeconds?: number;
  onToggleMute?: () => void;
}

export const VideoPreviewPlayer: React.FC<VideoPreviewPlayerProps> = ({
  asset,
  playbackSpeed = 1,
  isMuted = false,
  trimStartSeconds = 0,
  trimEndSeconds,
  onToggleMute,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(trimStartSeconds);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const duration = trimEndSeconds || asset.durationSeconds || 15;

  // Handle Playback Speed and Mute on HTML5 video element
  useEffect(() => {
    if (Platform.OS === 'web' && videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.muted = isMuted;
    }
  }, [playbackSpeed, isMuted]);

  // Trim constraints loop
  useEffect(() => {
    if (Platform.OS === 'web' && videoRef.current) {
      const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const cur = videoRef.current.currentTime;
        setCurrentTime(cur);

        if (trimEndSeconds && cur >= trimEndSeconds) {
          videoRef.current.currentTime = trimStartSeconds;
          videoRef.current.play().catch(() => {});
        }
      };

      videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
      return () => {
        videoRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [trimStartSeconds, trimEndSeconds]);

  const togglePlayPause = () => {
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);

    if (Platform.OS === 'web' && videoRef.current) {
      if (nextPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }

    setShowFeedback(true);
    setTimeout(() => {
      setShowFeedback(false);
    }, 500);
  };

  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel="Video preview player"
    >
      {/* 9:16 Video Container */}
      <TouchableOpacity
        style={styles.videoCanvas}
        activeOpacity={1}
        onPress={togglePlayPause}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pause preview' : 'Play preview'}
      >
        {Platform.OS === 'web' && asset.uri ? (
          <video
            ref={(ref) => {
              videoRef.current = ref;
              if (ref) {
                ref.src = asset.uri;
                ref.muted = isMuted;
                ref.playbackRate = playbackSpeed;
                if (isPlaying) {
                  ref.play().catch(() => {});
                }
              }
            }}
            loop
            playsInline
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <View style={styles.fallbackCanvas}>
            <Ionicons name="film-outline" size={40} color={BrandColors.cyan} />
            <Text style={styles.fallbackText}>Video Ready</Text>
          </View>
        )}

        {/* Temporary Play/Pause HUD Feedback */}
        {showFeedback && (
          <View style={styles.hudOverlay}>
            <View style={styles.hudCircle}>
              <Ionicons
                name={isPlaying ? 'play' : 'pause'}
                size={32}
                color={BrandColors.white}
              />
            </View>
          </View>
        )}

        {/* Top Floating Controls (Mute & Speed Indicator) */}
        <View style={styles.topBar}>
          <View style={styles.speedPill}>
            <Text style={styles.speedText}>{playbackSpeed}x</Text>
          </View>

          {onToggleMute && (
            <TouchableOpacity
              onPress={onToggleMute}
              style={[styles.muteButton, A11yStandards.minTouchTarget]}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={isMuted ? 'Unmute preview' : 'Mute preview'}
            >
              <Ionicons
                name={isMuted ? 'volume-mute' : 'volume-high'}
                size={18}
                color={BrandColors.white}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{Math.floor(currentTime)}s</Text>
            <Text style={styles.timeText}>{Math.floor(duration)}s</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  videoCanvas: {
    width: '100%',
    maxWidth: 320,
    aspectRatio: 9 / 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111111',
    position: 'relative',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#222222',
  },
  fallbackCanvas: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161616',
    gap: 8,
  },
  fallbackText: {
    color: BrandColors.darkTextSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  hudOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  hudCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    zIndex: 10,
  },
  speedPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  speedText: {
    color: BrandColors.cyan,
    fontSize: 11,
    fontWeight: '700',
  },
  muteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    zIndex: 10,
  },
  progressTrack: {
    height: 3,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: BrandColors.cyan,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    color: BrandColors.white,
    fontSize: 10,
    fontWeight: '600',
  },
});
