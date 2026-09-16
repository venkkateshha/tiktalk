/**
 * TikTalk Component: AudioWaveformVisualizer
 * Renders an animated reactive audio waveform indicator for active voice calls
 * using locked BrandColors.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BrandColors } from '../../../theme/colors';

export interface AudioWaveformVisualizerProps {
  isSpeaking?: boolean;
  isMuted?: boolean;
  barCount?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const AudioWaveformVisualizer: React.FC<AudioWaveformVisualizerProps> = ({
  isSpeaking = true,
  isMuted = false,
  barCount = 7,
  size = 'md',
}) => {
  const [heights, setHeights] = useState<number[]>(() =>
    Array.from({ length: barCount }, () => 8)
  );

  useEffect(() => {
    if (isMuted || !isSpeaking) {
      setHeights(Array.from({ length: barCount }, () => 6));
      return;
    }

    const interval = setInterval(() => {
      setHeights(
        Array.from({ length: barCount }, (_, i) => {
          const base = 8;
          const variance = Math.sin(Date.now() / 150 + i) * 14 + 16;
          return Math.max(base, Math.round(variance));
        })
      );
    }, 120);

    return () => clearInterval(interval);
  }, [isSpeaking, isMuted, barCount]);

  const maxH = size === 'lg' ? 48 : size === 'md' ? 32 : 18;
  const barW = size === 'lg' ? 5 : size === 'md' ? 4 : 3;

  return (
    <View style={[styles.container, { height: maxH }]}>
      {heights.map((h, index) => (
        <View
          key={index}
          style={[
            styles.bar,
            {
              width: barW,
              height: Math.min(h, maxH),
              backgroundColor: isMuted
                ? '#555555'
                : isSpeaking
                ? BrandColors.cyan
                : BrandColors.white,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  bar: {
    borderRadius: 2,
  },
});
