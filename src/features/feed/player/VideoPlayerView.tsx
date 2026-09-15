import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { VideoPlayerProps, PlaybackStatus } from './types';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export const VideoPlayerView: React.FC<VideoPlayerProps> = ({
  mediaUrl,
  thumbnailUrl,
  isActive,
  isMuted,
  isPlaying: propIsPlaying,
  onTogglePlayPause,
  onToggleMute,
  onPlaybackStatusUpdate,
  accessibilityDescription = 'Vertical short video',
}) => {
  const { brandColors, theme } = useTheme();
  const [internalPlaying, setInternalPlaying] = useState<boolean>(isActive);
  const isPlaying = propIsPlaying !== undefined ? propIsPlaying : internalPlaying;
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [showFeedbackIcon, setShowFeedbackIcon] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const videoRef = useRef<any>(null);
  const feedbackTimeout = useRef<any>(null);

  // Active item lifecycle: Pause immediately if this item becomes inactive
  useEffect(() => {
    if (!isActive) {
      setInternalPlaying(false);
      if (videoRef.current && Platform.OS === 'web') {
        videoRef.current.pause();
      }
    } else {
      setInternalPlaying(true);
      if (videoRef.current && Platform.OS === 'web' && mediaUrl) {
        videoRef.current.play().catch(() => {
          // Autoplay policy fallback: mute and retry
          if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play().catch(() => {});
          }
        });
      }
    }
  }, [isActive, mediaUrl]);

  // Window/Tab focus listener: Pause when app/browser tab loses focus
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          if (videoRef.current) videoRef.current.pause();
          setInternalPlaying(false);
        } else if (isActive) {
          if (videoRef.current) videoRef.current.play().catch(() => {});
          setInternalPlaying(true);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [isActive]);

  // Handle tap on video container to toggle play/pause
  const handleTapVideo = useCallback(() => {
    if (onTogglePlayPause) {
      onTogglePlayPause();
    } else {
      setInternalPlaying((prev) => !prev);
    }

    const nextPlaying = !isPlaying;
    if (Platform.OS === 'web' && videoRef.current) {
      if (nextPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }

    // Show temporary visual feedback
    setShowFeedbackIcon(true);
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    feedbackTimeout.current = setTimeout(() => {
      setShowFeedbackIcon(false);
    }, 600);

    onPlaybackStatusUpdate?.({
      isPlaying: nextPlaying,
      isMuted,
      isBuffering: false,
      positionMillis: progress * 15000,
      durationMillis: 15000,
      didJustFinish: false,
    });
  }, [onTogglePlayPause, isPlaying, isMuted, progress, onPlaybackStatusUpdate]);

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel={accessibilityDescription}
    >
      {/* Video Viewport / Web HTML5 Video Canvas */}
      <TouchableOpacity
        style={styles.touchArea}
        activeOpacity={1}
        onPress={handleTapVideo}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pause video' : 'Play video'}
        accessibilityState={{ busy: isBuffering }}
      >
        {Platform.OS === 'web' && mediaUrl ? (
          <video
            ref={videoRef}
            src={mediaUrl}
            poster={thumbnailUrl}
            muted={isMuted}
            loop
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              backgroundColor: brandColors.black,
            }}
            onTimeUpdate={(e: any) => {
              const current = e.target.currentTime;
              const duration = e.target.duration || 1;
              setProgress(current / duration);
            }}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => setIsBuffering(false)}
          />
        ) : (
          /* Placeholder video surface when awaiting real stream */
          <View style={[styles.fallbackCanvas, { backgroundColor: brandColors.black }]}>
            {isBuffering && (
              <ActivityIndicator size="large" color={brandColors.cyan} style={styles.loader} />
            )}
          </View>
        )}

        {/* Temporary Play/Pause HUD Feedback */}
        {showFeedbackIcon && (
          <View style={styles.hudOverlay} pointerEvents="none">
            <View style={styles.hudCircle}>
              <Ionicons
                name={isPlaying ? 'play' : 'pause'}
                size={44}
                color={brandColors.white}
              />
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Top Floating Mute/Unmute Indicator */}
      <TouchableOpacity
        onPress={onToggleMute}
        style={[styles.muteButton, A11yStandards.minTouchTarget]}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={isMuted ? 'Unmute video audio' : 'Mute video audio'}
        accessibilityState={{ selected: !isMuted }}
        activeOpacity={0.8}
      >
        <View style={styles.muteIconCircle}>
          <Ionicons
            name={isMuted ? 'volume-mute-outline' : 'volume-high-outline'}
            size={20}
            color={brandColors.white}
          />
        </View>
      </TouchableOpacity>

      {/* Bottom Video Progress Scrub Line */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBarActive,
            { width: `${Math.max(0, Math.min(100, progress * 100))}%`, backgroundColor: brandColors.cyan },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  touchArea: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackCanvas: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    position: 'absolute',
  },
  hudOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  hudCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  muteButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muteIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 25,
  },
  progressBarActive: {
    height: '100%',
  },
});
