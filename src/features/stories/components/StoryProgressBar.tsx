import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme';

export interface StoryProgressBarProps {
  totalStories: number;
  currentIndex: number;
  currentProgress: number; // 0.0 to 1.0
}

export const StoryProgressBar: React.FC<StoryProgressBarProps> = ({
  totalStories,
  currentIndex,
  currentProgress,
}) => {
  const { brandColors } = useTheme();

  if (totalStories <= 0) return null;

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={`Story ${currentIndex + 1} of ${totalStories}`}
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(currentProgress * 100),
      }}
    >
      {Array.from({ length: totalStories }).map((_, index) => {
        let fillPercent = 0;
        if (index < currentIndex) {
          fillPercent = 100;
        } else if (index === currentIndex) {
          fillPercent = Math.min(100, Math.max(0, currentProgress * 100));
        }

        return (
          <View key={index} style={styles.segmentTrack}>
            <View
              style={[
                styles.segmentFill,
                {
                  width: `${fillPercent}%`,
                  backgroundColor: brandColors.cyan,
                },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 4,
    height: 4,
    width: '100%',
  },
  segmentTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  segmentFill: {
    height: '100%',
    borderRadius: 2,
  },
});
