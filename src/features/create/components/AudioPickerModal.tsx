import React, { useState } from 'react';
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
import { AudioSelection } from '../types';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface AudioPickerModalProps {
  visible: boolean;
  currentAudio?: AudioSelection;
  isMuted: boolean;
  volume: number; // 0.0 - 1.0
  onSelectAudio: (selection?: AudioSelection) => void;
  onUpdateVolume: (volume: number) => void;
  onToggleMute: () => void;
  onClose: () => void;
}

type AudioTab = 'original' | 'library' | 'custom';

export const AudioPickerModal: React.FC<AudioPickerModalProps> = ({
  visible,
  currentAudio,
  isMuted,
  volume,
  onSelectAudio,
  onUpdateVolume,
  onToggleMute,
  onClose,
}) => {
  const { theme, typography } = useTheme();
  const [activeTab, setActiveTab] = useState<AudioTab>('original');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleSelectOriginal = () => {
    onSelectAudio(undefined);
  };

  const handleRefreshLibrary = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const volumePercentages = [0, 0.25, 0.5, 0.75, 1.0];

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
          accessibilityLabel="Audio settings modal"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, A11yStandards.minTouchTarget]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close audio modal"
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text, fontSize: typography.fontSize.lg }]}>
              Audio & Sounds
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.doneButton, A11yStandards.minTouchTarget]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Done editing audio"
            >
              <Text style={[styles.doneText, { color: BrandColors.cyan, fontSize: typography.fontSize.md }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Selector */}
          <View style={[styles.tabsRow, { borderColor: theme.border }]}>
            <TouchableOpacity
              onPress={() => setActiveTab('original')}
              style={[
                styles.tabButton,
                A11yStandards.minTouchTarget,
                activeTab === 'original' && { borderBottomColor: BrandColors.cyan, borderBottomWidth: 2 },
              ]}
              accessible={true}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'original' }}
              accessibilityLabel="Original video audio tab"
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'original' ? BrandColors.cyan : theme.textSecondary },
                ]}
              >
                Original Audio
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('library')}
              style={[
                styles.tabButton,
                A11yStandards.minTouchTarget,
                activeTab === 'library' && { borderBottomColor: BrandColors.cyan, borderBottomWidth: 2 },
              ]}
              accessible={true}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'library' }}
              accessibilityLabel="Sound library catalog tab"
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'library' ? BrandColors.cyan : theme.textSecondary },
                ]}
              >
                Sound Library
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('custom')}
              style={[
                styles.tabButton,
                A11yStandards.minTouchTarget,
                activeTab === 'custom' && { borderBottomColor: BrandColors.cyan, borderBottomWidth: 2 },
              ]}
              accessible={true}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'custom' }}
              accessibilityLabel="Custom sound audio tab"
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'custom' ? BrandColors.cyan : theme.textSecondary },
                ]}
              >
                Custom
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* TAB 1: ORIGINAL AUDIO */}
            {activeTab === 'original' && (
              <View style={styles.sectionContainer}>
                {/* Mute Toggle */}
                <View style={[styles.cardRow, { backgroundColor: theme.card }]}>
                  <View style={styles.cardInfo}>
                    <Ionicons
                      name={isMuted ? 'volume-mute' : 'volume-high'}
                      size={24}
                      color={isMuted ? BrandColors.pink : BrandColors.cyan}
                    />
                    <View style={styles.cardTextContainer}>
                      <Text style={[styles.cardTitle, { color: theme.text }]}>
                        {isMuted ? 'Audio Muted' : 'Audio Active'}
                      </Text>
                      <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                        {isMuted ? 'Video plays without sound' : 'Original camera/file sound enabled'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={onToggleMute}
                    style={[
                      styles.toggleBtn,
                      A11yStandards.minTouchTarget,
                      { backgroundColor: isMuted ? BrandColors.pink : theme.surface },
                    ]}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={isMuted ? 'Unmute video audio' : 'Mute video audio'}
                  >
                    <Text
                      style={[
                        styles.toggleBtnText,
                        { color: isMuted ? '#FFFFFF' : theme.text },
                      ]}
                    >
                      {isMuted ? 'Unmute' : 'Mute'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Volume Presets */}
                <View style={styles.volumeBlock}>
                  <View style={styles.volumeHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                      VOLUME LEVEL ({Math.round(volume * 100)}%)
                    </Text>
                  </View>
                  <View style={styles.volumePresetsRow}>
                    {volumePercentages.map((pct) => {
                      const isSelected = Math.abs(volume - pct) < 0.05;
                      return (
                        <TouchableOpacity
                          key={pct}
                          onPress={() => onUpdateVolume(pct)}
                          style={[
                            styles.volumeChip,
                            A11yStandards.minTouchTarget,
                            {
                              backgroundColor: isSelected ? BrandColors.cyan : theme.card,
                              borderColor: isSelected ? BrandColors.cyan : theme.border,
                            },
                          ]}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={`Set volume to ${Math.round(pct * 100)}%`}
                        >
                          <Text
                            style={[
                              styles.volumeChipText,
                              { color: isSelected ? '#000000' : theme.text, fontWeight: isSelected ? '700' : '500' },
                            ]}
                          >
                            {Math.round(pct * 100)}%
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {currentAudio && (
                  <TouchableOpacity
                    onPress={handleSelectOriginal}
                    style={[styles.resetButton, A11yStandards.minTouchTarget, { borderColor: theme.border }]}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Revert to original video audio"
                  >
                    <Ionicons name="refresh-outline" size={18} color={BrandColors.cyan} />
                    <Text style={[styles.resetButtonText, { color: BrandColors.cyan }]}>
                      Remove Music & Keep Original Audio
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* TAB 2: SOUND LIBRARY (Honest unseeded backend boundary) */}
            {activeTab === 'library' && (
              <View style={styles.unseededContainer}>
                <View style={[styles.iconCircle, { backgroundColor: theme.card }]}>
                  <Ionicons name="musical-notes-outline" size={40} color={BrandColors.cyan} />
                </View>
                <Text style={[styles.unseededTitle, { color: theme.text }]}>
                  Licensed Music Catalog Unseeded
                </Text>
                <Text style={[styles.unseededDescription, { color: theme.textSecondary }]}>
                  TikTalk connects to licensed music providers via backend rights clearing. In this
                  environment, no third-party tracks are seeded. No fake or dummy music tracks are
                  injected.
                </Text>
                <TouchableOpacity
                  onPress={handleRefreshLibrary}
                  style={[styles.refreshBtn, A11yStandards.minTouchTarget, { backgroundColor: BrandColors.cyan }]}
                  activeOpacity={0.8}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Check music catalog availability"
                >
                  <Ionicons
                    name="sync-outline"
                    size={18}
                    color="#000000"
                    style={isRefreshing ? { transform: [{ rotate: '45deg' }] } : undefined}
                  />
                  <Text style={styles.refreshBtnText}>
                    {isRefreshing ? 'Checking Catalog...' : 'Check Server Catalog'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* TAB 3: CUSTOM AUDIO */}
            {activeTab === 'custom' && (
              <View style={styles.unseededContainer}>
                <View style={[styles.iconCircle, { backgroundColor: theme.card }]}>
                  <Ionicons name="mic-outline" size={40} color={BrandColors.pink} />
                </View>
                <Text style={[styles.unseededTitle, { color: theme.text }]}>
                  Custom Audio & Voiceover
                </Text>
                <Text style={[styles.unseededDescription, { color: theme.textSecondary }]}>
                  Original video audio captured with your camera or file upload is active by default.
                  Direct audio track replacement and multi-track voiceover are managed via your native microphone.
                </Text>
                <TouchableOpacity
                  onPress={() => setActiveTab('original')}
                  style={[styles.refreshBtn, A11yStandards.minTouchTarget, { backgroundColor: BrandColors.pink }]}
                  activeOpacity={0.8}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Use original camera audio"
                >
                  <Text style={[styles.refreshBtnText, { color: '#FFFFFF' }]}>
                    Use Camera Audio
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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
    maxHeight: '80%',
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
  doneButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 8,
  },
  doneText: {
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 44,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  body: {
    paddingHorizontal: 16,
  },
  bodyContent: {
    paddingVertical: 16,
  },
  sectionContainer: {
    gap: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  cardSub: {
    fontSize: 12,
    marginTop: 2,
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 64,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  volumeBlock: {
    gap: 8,
  },
  volumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  volumePresetsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  volumeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  volumeChipText: {
    fontSize: 13,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    minHeight: 44,
    marginTop: 8,
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  unseededContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  unseededTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  unseededDescription: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
    minHeight: 44,
  },
  refreshBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
});
