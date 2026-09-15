import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { VideoEditState } from '../types';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface VideoEditToolbarProps {
  editState: VideoEditState;
  maxDuration: number;
  onUpdateEditState: (updater: Partial<VideoEditState>) => void;
  onOpenCaptions: () => void;
  onOpenAudio: () => void;
  onOpenCover: () => void;
}

export const VideoEditToolbar: React.FC<VideoEditToolbarProps> = ({
  editState,
  maxDuration,
  onUpdateEditState,
  onOpenCaptions,
  onOpenAudio,
  onOpenCover,
}) => {
  const { theme, typography } = useTheme();
  const [showTrimControls, setShowTrimControls] = useState<boolean>(false);

  const speeds: (0.5 | 1 | 1.5 | 2)[] = [0.5, 1, 1.5, 2];

  const cycleSpeed = () => {
    const currentIndex = speeds.indexOf(editState.playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    onUpdateEditState({ playbackSpeed: speeds[nextIndex] });
  };

  const toggleMute = () => {
    onUpdateEditState({ isMuted: !editState.isMuted });
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}
      accessible={true}
      accessibilityRole="toolbar"
      accessibilityLabel="Video editing tools"
    >
      {/* Primary Toolbar Items */}
      <View style={styles.toolsRow}>
        {/* 1. Trim Button */}
        <TouchableOpacity
          onPress={() => setShowTrimControls(!showTrimControls)}
          style={[styles.toolButton, A11yStandards.minTouchTarget]}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Trim video start and end times"
        >
          <Ionicons
            name="cut-outline"
            size={22}
            color={showTrimControls ? BrandColors.cyan : theme.text}
          />
          <Text
            style={[
              styles.toolLabel,
              { color: showTrimControls ? BrandColors.cyan : theme.textSecondary, fontSize: typography.fontSize.xs },
            ]}
          >
            Trim
          </Text>
        </TouchableOpacity>

        {/* 2. Speed Button */}
        <TouchableOpacity
          onPress={cycleSpeed}
          style={[styles.toolButton, A11yStandards.minTouchTarget]}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Cycle playback speed, currently ${editState.playbackSpeed}x`}
        >
          <Ionicons name="speedometer-outline" size={22} color={BrandColors.cyan} />
          <Text
            style={[styles.toolLabel, { color: BrandColors.cyan, fontSize: typography.fontSize.xs }]}
          >
            {editState.playbackSpeed}x
          </Text>
        </TouchableOpacity>

        {/* 3. Mute / Volume */}
        <TouchableOpacity
          onPress={toggleMute}
          style={[styles.toolButton, A11yStandards.minTouchTarget]}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={editState.isMuted ? 'Unmute audio' : 'Mute audio'}
        >
          <Ionicons
            name={editState.isMuted ? 'volume-mute-outline' : 'volume-high-outline'}
            size={22}
            color={editState.isMuted ? BrandColors.pink : theme.text}
          />
          <Text
            style={[
              styles.toolLabel,
              { color: editState.isMuted ? BrandColors.pink : theme.textSecondary, fontSize: typography.fontSize.xs },
            ]}
          >
            {editState.isMuted ? 'Muted' : 'Sound'}
          </Text>
        </TouchableOpacity>

        {/* 4. Captions Button */}
        <TouchableOpacity
          onPress={onOpenCaptions}
          style={[styles.toolButton, A11yStandards.minTouchTarget]}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Configure captions"
        >
          <Ionicons
            name="text-outline"
            size={22}
            color={editState.captionConfig?.enabled ? BrandColors.cyan : theme.text}
          />
          <Text
            style={[
              styles.toolLabel,
              {
                color: editState.captionConfig?.enabled ? BrandColors.cyan : theme.textSecondary,
                fontSize: typography.fontSize.xs,
              },
            ]}
          >
            Captions
          </Text>
        </TouchableOpacity>

        {/* 5. Music / Audio Button */}
        <TouchableOpacity
          onPress={onOpenAudio}
          style={[styles.toolButton, A11yStandards.minTouchTarget]}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Audio and sound settings"
        >
          <Ionicons name="musical-note-outline" size={22} color={theme.text} />
          <Text style={[styles.toolLabel, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]}>
            Audio
          </Text>
        </TouchableOpacity>

        {/* 6. Cover Button */}
        <TouchableOpacity
          onPress={onOpenCover}
          style={[styles.toolButton, A11yStandards.minTouchTarget]}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Select video cover frame"
        >
          <Ionicons name="image-outline" size={22} color={theme.text} />
          <Text style={[styles.toolLabel, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]}>
            Cover
          </Text>
        </TouchableOpacity>
      </View>

      {/* Expandable Trim Controls */}
      {showTrimControls && (
        <View style={[styles.trimSection, { borderTopColor: theme.border }]}>
          <Text style={[styles.trimTitle, { color: theme.text, fontSize: typography.fontSize.xs }]}>
            Trim Duration ({editState.trimStartSeconds}s to {editState.trimEndSeconds}s of {Math.floor(maxDuration)}s)
          </Text>
          <View style={styles.trimButtonsRow}>
            <TouchableOpacity
              onPress={() =>
                onUpdateEditState({
                  trimStartSeconds: Math.max(0, editState.trimStartSeconds - 1),
                })
              }
              style={[styles.trimStepBtn, { backgroundColor: theme.card }, A11yStandards.minTouchTarget]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Decrease start time by 1 second"
            >
              <Text style={[styles.trimStepText, { color: theme.text }]}>-1s Start</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                onUpdateEditState({
                  trimStartSeconds: Math.min(editState.trimEndSeconds - 1, editState.trimStartSeconds + 1),
                })
              }
              style={[styles.trimStepBtn, { backgroundColor: theme.card }, A11yStandards.minTouchTarget]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Increase start time by 1 second"
            >
              <Text style={[styles.trimStepText, { color: theme.text }]}>+1s Start</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                onUpdateEditState({
                  trimEndSeconds: Math.max(editState.trimStartSeconds + 1, editState.trimEndSeconds - 1),
                })
              }
              style={[styles.trimStepBtn, { backgroundColor: theme.card }, A11yStandards.minTouchTarget]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Decrease end time by 1 second"
            >
              <Text style={[styles.trimStepText, { color: theme.text }]}>-1s End</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                onUpdateEditState({
                  trimEndSeconds: Math.min(maxDuration, editState.trimEndSeconds + 1),
                })
              }
              style={[styles.trimStepBtn, { backgroundColor: theme.card }, A11yStandards.minTouchTarget]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Increase end time by 1 second"
            >
              <Text style={[styles.trimStepText, { color: theme.text }]}>+1s End</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  toolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  toolButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  toolLabel: {
    fontWeight: '600',
    marginTop: 2,
  },
  trimSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  trimTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  trimButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  trimStepBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trimStepText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
