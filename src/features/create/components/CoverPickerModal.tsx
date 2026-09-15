import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { CoverConfig } from '../types';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface CoverPickerModalProps {
  visible: boolean;
  coverConfig: CoverConfig;
  durationSeconds?: number;
  onSave: (cover: CoverConfig) => void;
  onClose: () => void;
}

export const CoverPickerModal: React.FC<CoverPickerModalProps> = ({
  visible,
  coverConfig,
  durationSeconds = 15,
  onSave,
  onClose,
}) => {
  const { theme, typography } = useTheme();
  const [selectedTimestamp, setSelectedTimestamp] = useState<number>(
    coverConfig.timestampSeconds ?? 0
  );
  const [selectedSource, setSelectedSource] = useState<CoverConfig['source']>(
    coverConfig.source
  );

  useEffect(() => {
    setSelectedTimestamp(coverConfig.timestampSeconds ?? 0);
    setSelectedSource(coverConfig.source);
  }, [coverConfig, visible]);

  // Generate 5 sample frame checkpoints across the duration
  const frameCheckpoints = [
    0,
    Math.round(durationSeconds * 0.25),
    Math.round(durationSeconds * 0.5),
    Math.round(durationSeconds * 0.75),
    Math.max(1, Math.round(durationSeconds - 1)),
  ];

  const handleSave = () => {
    onSave({
      source: selectedSource,
      timestampSeconds: selectedTimestamp,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheetContainer,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          accessible={true}
          accessibilityRole="none"
          accessibilityLabel="Cover thumbnail selector modal"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, A11yStandards.minTouchTarget]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Cancel cover selection"
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text, fontSize: typography.fontSize.lg }]}>
              Select Video Cover
            </Text>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveButton, A11yStandards.minTouchTarget]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Save cover selection"
            >
              <Text style={[styles.saveText, { color: BrandColors.cyan, fontSize: typography.fontSize.md }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* Instruction */}
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              Choose a frame from your video to act as the cover image when displayed on profile grids and feeds.
            </Text>

            {/* Frame Checkpoints Row */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                TIMESTAMPS FROM VIDEO
              </Text>
              <View style={styles.framesGrid}>
                {frameCheckpoints.map((t, idx) => {
                  const isSelected =
                    selectedSource === 'frame' && selectedTimestamp === t;
                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => {
                        setSelectedSource('frame');
                        setSelectedTimestamp(t);
                      }}
                      style={[
                        styles.frameCard,
                        A11yStandards.minTouchTarget,
                        {
                          backgroundColor: '#000000',
                          borderColor: isSelected ? BrandColors.cyan : theme.border,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Cover frame at ${t} seconds`}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Ionicons
                        name="image-outline"
                        size={24}
                        color={isSelected ? BrandColors.cyan : 'rgba(255,255,255,0.6)'}
                      />
                      <Text
                        style={[
                          styles.frameTime,
                          { color: isSelected ? BrandColors.cyan : '#FFFFFF' },
                        ]}
                      >
                        {t}s
                      </Text>
                      {isSelected && (
                        <View style={[styles.selectedBadge, { backgroundColor: BrandColors.cyan }]}>
                          <Ionicons name="checkmark" size={12} color="#000000" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Default first frame */}
            <TouchableOpacity
              onPress={() => {
                setSelectedSource('default');
                setSelectedTimestamp(0);
              }}
              style={[
                styles.optionRow,
                A11yStandards.minTouchTarget,
                {
                  backgroundColor: theme.card,
                  borderColor: selectedSource === 'default' ? BrandColors.cyan : theme.border,
                  borderWidth: selectedSource === 'default' ? 2 : 1,
                },
              ]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Use default first frame as cover"
            >
              <View style={styles.optionInfo}>
                <Ionicons
                  name="play-skip-back-circle-outline"
                  size={24}
                  color={selectedSource === 'default' ? BrandColors.cyan : theme.text}
                />
                <View>
                  <Text style={[styles.optionTitle, { color: theme.text }]}>
                    Default First Frame
                  </Text>
                  <Text style={[styles.optionSub, { color: theme.textSecondary }]}>
                    Always start with the first recorded frame (0s)
                  </Text>
                </View>
              </View>
              {selectedSource === 'default' && (
                <Ionicons name="checkmark-circle" size={22} color={BrandColors.cyan} />
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    maxHeight: '75%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  title: {
    fontWeight: '700',
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 8,
  },
  saveText: {
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: 16,
  },
  bodyContent: {
    paddingVertical: 16,
    gap: 16,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  framesGrid: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  frameCard: {
    flex: 1,
    aspectRatio: 9 / 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  frameTime: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  selectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionSub: {
    fontSize: 12,
    marginTop: 2,
  },
});
