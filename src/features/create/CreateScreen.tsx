import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { BrandColors } from '../../theme/colors';
import { Badge } from '../../components/ui/Badge';
import { Ionicons } from '@expo/vector-icons';

export const CreateScreen: React.FC = () => {
  const { typography } = useTheme();
  const [duration, setDuration] = useState<'15s' | '60s' | '3m'>('15s');
  const [speed, setSpeed] = useState<'0.5x' | '1x' | '2x'>('1x');

  return (
    <View style={styles.container}>
      {/* Top Controls: Sound Selector */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.soundPill} activeOpacity={0.8}>
          <Ionicons name="musical-notes" size={16} color={BrandColors.white} />
          <Text style={[styles.soundText, { fontSize: typography.fontSize.xs }]}>
            Add Sound • Waveform Sync
          </Text>
        </TouchableOpacity>
      </View>

      {/* Right HUD Controls */}
      <View style={styles.rightHud}>
        <TouchableOpacity style={styles.hudItem}>
          <Ionicons name="camera-reverse-outline" size={26} color={BrandColors.white} />
          <Text style={styles.hudLabel}>Flip</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.hudItem} onPress={() => setSpeed(speed === '1x' ? '2x' : speed === '2x' ? '0.5x' : '1x')}>
          <Ionicons name="speedometer-outline" size={26} color={BrandColors.cyan} />
          <Text style={[styles.hudLabel, { color: BrandColors.cyan }]}>{speed}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.hudItem}>
          <Ionicons name="timer-outline" size={26} color={BrandColors.white} />
          <Text style={styles.hudLabel}>Timer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.hudItem}>
          <Ionicons name="color-wand-outline" size={26} color={BrandColors.pink} />
          <Text style={[styles.hudLabel, { color: BrandColors.pink }]}>Beauty</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.hudItem}>
          <Ionicons name="duplicate-outline" size={26} color={BrandColors.white} />
          <Text style={styles.hudLabel}>Duet</Text>
        </TouchableOpacity>
      </View>

      {/* Center Camera Preview Area */}
      <View style={styles.centerCanvas}>
        <View style={styles.badgeWrapper}>
          <Badge label="VisionCamera • Phase 0 Shell" variant="primary" />
        </View>
        <Text style={[styles.cameraTitle, { fontSize: typography.fontSize.lg }]}>
          Creator Studio Ready
        </Text>
        <Text style={[styles.cameraSubtitle, { fontSize: typography.fontSize.xs }]}>
          Frame Processors • PTS Audio Sync • 720p H.265 Hardware Transcoding
        </Text>
      </View>

      {/* Bottom Duration Selector and Record Shutter */}
      <View style={styles.bottomControls}>
        <View style={styles.durationRow}>
          {(['15s', '60s', '3m'] as const).map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.durationTab, duration === d && styles.durationTabActive]}
              onPress={() => setDuration(d)}
            >
              <Text style={[styles.durationText, duration === d && styles.durationTextActive]}>
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Shutter Button */}
        <View style={styles.shutterRow}>
          <TouchableOpacity style={styles.shutterOuter} activeOpacity={0.8}>
            <View style={styles.shutterInner} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.black,
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  topBar: {
    alignItems: 'center',
    paddingTop: 8,
  },
  soundPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BrandColors.darkBorder,
  },
  soundText: {
    color: BrandColors.white,
    marginLeft: 8,
    fontWeight: '600',
  },
  rightHud: {
    position: 'absolute',
    right: 16,
    top: 60,
    gap: 18,
    alignItems: 'center',
    zIndex: 10,
  },
  hudItem: {
    alignItems: 'center',
  },
  hudLabel: {
    color: BrandColors.white,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  centerCanvas: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  badgeWrapper: {
    marginBottom: 8,
  },
  cameraTitle: {
    color: BrandColors.white,
    fontWeight: '700',
    textAlign: 'center',
  },
  cameraSubtitle: {
    color: BrandColors.darkTextSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  bottomControls: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  durationTab: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
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
    alignItems: 'center',
    justifyContent: 'center',
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
});
