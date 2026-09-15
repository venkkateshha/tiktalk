import React, { useState, useEffect, useRef } from 'react';
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
import { Badge } from '../../../components/ui/Badge';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface CameraCaptureViewProps {
  onCancel: () => void;
  onCompleteCapture: (asset: MediaAsset) => void;
  onOpenGallery: () => void;
}

export const CameraCaptureView: React.FC<CameraCaptureViewProps> = ({
  onCancel,
  onCompleteCapture,
  onOpenGallery,
}) => {
  const [duration, setDuration] = useState<'15s' | '60s' | '3m'>('15s');
  const [speed, setSpeed] = useState<'0.5x' | '1x' | '2x'>('1x');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedSeconds, setRecordedSeconds] = useState<number>(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraAvailable, setCameraAvailable] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordIntervalRef = useRef<any>(null);

  const maxSeconds = duration === '15s' ? 15 : duration === '60s' ? 60 : 180;

  // Initialize Web Camera if supported
  useEffect(() => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode }, audio: true })
        .then((stream) => {
          streamRef.current = stream;
          setCameraAvailable(true);
          setCameraError(null);
          if (videoElementRef.current) {
            videoElementRef.current.srcObject = stream;
            videoElementRef.current.play().catch(() => {});
          }
        })
        .catch(() => {
          // Camera permission denied or not connected in browser environment
          setCameraAvailable(false);
          setCameraError('Camera preview unavailable in current environment. You can upload video files directly.');
        });
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
      }
    };
  }, [facingMode]);

  // Handle Recording State & Timer
  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording and emit asset
      stopRecording();
    } else {
      // Start recording
      setIsRecording(true);
      setRecordedSeconds(0);
      recordIntervalRef.current = setInterval(() => {
        setRecordedSeconds((prev) => {
          const next = prev + 1;
          if (next >= maxSeconds) {
            stopRecording();
            return maxSeconds;
          }
          return next;
        });
      }, 1000);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
    }

    const capturedAsset: MediaAsset = {
      id: `capture_${Date.now()}`,
      uri: 'blob:tiktalk-camera-captured-video',
      mimeType: 'video/mp4',
      durationSeconds: Math.max(1, recordedSeconds),
      source: 'camera',
    };

    onCompleteCapture(capturedAsset);
  };

  const flipCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel="Camera recording screen"
    >
      {/* Underlying Camera Viewport */}
      {Platform.OS === 'web' && cameraAvailable ? (
        <video
          ref={(ref) => {
            videoElementRef.current = ref;
            if (ref && streamRef.current && !ref.srcObject) {
              ref.srcObject = streamRef.current;
              ref.play().catch(() => {});
            }
          }}
          autoPlay
          playsInline
          muted
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
          <Ionicons name="videocam-outline" size={48} color={BrandColors.cyan} />
          <View style={styles.badgeWrapper}>
            <Badge label="STUDIO CAMERA ENGINE" variant="primary" />
          </View>
          <Text style={styles.fallbackTitle}>Camera Ready</Text>
          <Text style={styles.fallbackSubtitle}>
            {cameraError || '60 FPS 1080p Hardware Capture Ready'}
          </Text>
        </View>
      )}

      {/* Top Bar: Close / Sound / Flip */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={onCancel}
          style={[styles.topButton, A11yStandards.minTouchTarget]}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Exit camera"
        >
          <Ionicons name="close" size={26} color={BrandColors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.soundPill}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Add sound"
        >
          <Ionicons name="musical-notes" size={14} color={BrandColors.white} />
          <Text style={styles.soundText}>Add Sound</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={flipCamera}
          style={[styles.topButton, A11yStandards.minTouchTarget]}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Flip camera direction"
        >
          <Ionicons name="camera-reverse-outline" size={24} color={BrandColors.white} />
        </TouchableOpacity>
      </View>

      {/* Right HUD Tools */}
      <View style={styles.rightHud}>
        <TouchableOpacity
          style={styles.hudItem}
          onPress={() => setSpeed(speed === '1x' ? '2x' : speed === '2x' ? '0.5x' : '1x')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Playback speed ${speed}`}
        >
          <Ionicons name="speedometer-outline" size={24} color={BrandColors.cyan} />
          <Text style={[styles.hudLabel, { color: BrandColors.cyan }]}>{speed}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.hudItem}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Camera timer"
        >
          <Ionicons name="timer-outline" size={24} color={BrandColors.white} />
          <Text style={styles.hudLabel}>Timer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.hudItem}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Filters"
        >
          <Ionicons name="color-wand-outline" size={24} color={BrandColors.pink} />
          <Text style={[styles.hudLabel, { color: BrandColors.pink }]}>Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Recording Timer Display (When active) */}
      {isRecording && (
        <View style={styles.recordTimerBanner}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordTimerText}>
            {recordedSeconds}s / {maxSeconds}s
          </Text>
        </View>
      )}

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Duration Tabs */}
        {!isRecording && (
          <View style={styles.durationRow}>
            {(['15s', '60s', '3m'] as const).map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.durationTab, duration === d && styles.durationTabActive]}
                onPress={() => setDuration(d)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${d} duration`}
              >
                <Text style={[styles.durationText, duration === d && styles.durationTextActive]}>
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Shutter Row with Gallery CTA */}
        <View style={styles.shutterRow}>
          <TouchableOpacity
            onPress={onOpenGallery}
            style={[styles.galleryButton, A11yStandards.minTouchTarget]}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Select from gallery"
          >
            <Ionicons name="images-outline" size={24} color={BrandColors.white} />
            <Text style={styles.galleryButtonText}>Upload</Text>
          </TouchableOpacity>

          {/* Shutter Button */}
          <TouchableOpacity
            onPress={toggleRecording}
            style={[
              styles.shutterOuter,
              isRecording && { borderColor: BrandColors.pink },
              A11yStandards.minTouchTarget,
            ]}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <View
              style={[
                styles.shutterInner,
                isRecording && styles.shutterRecording,
              ]}
            />
          </TouchableOpacity>

          {/* Symmetrical placeholder for alignment */}
          <View style={styles.galleryPlaceholder} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.black,
    position: 'relative',
    justifyContent: 'space-between',
  },
  fallbackCanvas: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F0F0F',
    paddingHorizontal: 24,
  },
  badgeWrapper: {
    marginTop: 12,
    marginBottom: 8,
  },
  fallbackTitle: {
    color: BrandColors.white,
    fontSize: 20,
    fontWeight: '800',
  },
  fallbackSubtitle: {
    color: BrandColors.darkTextSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
    lineHeight: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 10,
  },
  topButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 6,
  },
  soundText: {
    color: BrandColors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  rightHud: {
    position: 'absolute',
    right: 16,
    top: 70,
    gap: 16,
    alignItems: 'center',
    zIndex: 10,
  },
  hudItem: {
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  hudLabel: {
    color: BrandColors.white,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  recordTimerBanner: {
    position: 'absolute',
    top: 74,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 8,
    zIndex: 10,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BrandColors.pink,
  },
  recordTimerText: {
    color: BrandColors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  bottomControls: {
    alignItems: 'center',
    paddingBottom: 24,
    zIndex: 10,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  durationTab: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  durationTabActive: {
    backgroundColor: BrandColors.white,
  },
  durationText: {
    color: BrandColors.darkTextSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  durationTextActive: {
    color: BrandColors.black,
  },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 36,
  },
  galleryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  galleryButtonText: {
    color: BrandColors.white,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  galleryPlaceholder: {
    width: 44,
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: BrandColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BrandColors.pink,
  },
  shutterRecording: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
});
