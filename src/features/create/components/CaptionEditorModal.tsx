import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { CaptionConfig } from '../types';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface CaptionEditorModalProps {
  visible: boolean;
  initialConfig: CaptionConfig;
  onSave: (config: CaptionConfig) => void;
  onClose: () => void;
}

const STYLES: CaptionConfig['style'][] = ['classic', 'neon', 'bold', 'minimal'];
const POSITIONS: CaptionConfig['position'][] = ['top', 'center', 'bottom'];

export const CaptionEditorModal: React.FC<CaptionEditorModalProps> = ({
  visible,
  initialConfig,
  onSave,
  onClose,
}) => {
  const { theme, typography } = useTheme();
  const [config, setConfig] = useState<CaptionConfig>(initialConfig);

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig, visible]);

  const handleSave = () => {
    onSave(config);
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
          accessibilityLabel="Caption editor modal"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, A11yStandards.minTouchTarget]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Cancel captions"
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text, fontSize: typography.fontSize.lg }]}>
              Text & Captions
            </Text>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveButton, A11yStandards.minTouchTarget]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Save captions"
            >
              <Text style={[styles.saveText, { color: BrandColors.cyan, fontSize: typography.fontSize.md }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* Enable toggle */}
            <View style={[styles.switchRow, { borderColor: theme.border }]}>
              <View>
                <Text style={[styles.switchLabel, { color: theme.text }]}>Enable Overlay Caption</Text>
                <Text style={[styles.switchHint, { color: theme.textSecondary }]}>
                  Display text overlay during video playback
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
                style={[
                  styles.toggleBadge,
                  A11yStandards.minTouchTarget,
                  { backgroundColor: config.enabled ? BrandColors.cyan : theme.card },
                ]}
                accessible={true}
                accessibilityRole="switch"
                accessibilityLabel="Toggle caption overlay"
                accessibilityState={{ checked: config.enabled }}
              >
                <Text
                  style={[
                    styles.toggleBadgeText,
                    { color: config.enabled ? '#000000' : theme.textSecondary },
                  ]}
                >
                  {config.enabled ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Input field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
                CAPTION TEXT
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: theme.text,
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Enter caption text (e.g., Today's adventure...)"
                placeholderTextColor={theme.textMuted}
                value={config.text}
                onChangeText={(text) => setConfig((prev) => ({ ...prev, text }))}
                maxLength={200}
                multiline={true}
                numberOfLines={3}
                accessible={true}
                accessibilityLabel="Caption text input"
              />
              <Text style={[styles.charCount, { color: theme.textMuted }]}>
                {config.text.length} / 200
              </Text>
            </View>

            {/* Style Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>STYLE</Text>
              <View style={styles.optionRow}>
                {STYLES.map((st) => {
                  const isSelected = config.style === st;
                  return (
                    <TouchableOpacity
                      key={st}
                      onPress={() => setConfig((prev) => ({ ...prev, style: st }))}
                      style={[
                        styles.chip,
                        A11yStandards.minTouchTarget,
                        {
                          backgroundColor: isSelected ? BrandColors.pink : theme.card,
                          borderColor: isSelected ? BrandColors.pink : theme.border,
                        },
                      ]}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Style ${st}`}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: isSelected ? '#FFFFFF' : theme.text, fontWeight: isSelected ? '700' : '500' },
                        ]}
                      >
                        {st.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Position Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
                VERTICAL POSITION
              </Text>
              <View style={styles.optionRow}>
                {POSITIONS.map((pos) => {
                  const isSelected = config.position === pos;
                  return (
                    <TouchableOpacity
                      key={pos}
                      onPress={() => setConfig((prev) => ({ ...prev, position: pos }))}
                      style={[
                        styles.chip,
                        A11yStandards.minTouchTarget,
                        {
                          backgroundColor: isSelected ? BrandColors.cyan : theme.card,
                          borderColor: isSelected ? BrandColors.cyan : theme.border,
                        },
                      ]}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Position ${pos}`}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: isSelected ? '#000000' : theme.text, fontWeight: isSelected ? '700' : '500' },
                        ]}
                      >
                        {pos.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Live Preview Box */}
            <View style={styles.previewContainer}>
              <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>PREVIEW</Text>
              <View style={styles.previewBox}>
                <View
                  style={[
                    styles.previewContent,
                    config.position === 'top' && { justifyContent: 'flex-start' },
                    config.position === 'center' && { justifyContent: 'center' },
                    config.position === 'bottom' && { justifyContent: 'flex-end' },
                  ]}
                >
                  <Text
                    style={[
                      styles.previewText,
                      config.style === 'neon' && { color: BrandColors.cyan, textShadowColor: BrandColors.cyan, textShadowRadius: 8 },
                      config.style === 'bold' && { fontWeight: '900', color: '#FFFFFF' },
                      config.style === 'minimal' && { opacity: 0.8, fontSize: 13 },
                    ]}
                  >
                    {config.text || '(No caption text)'}
                  </Text>
                </View>
              </View>
            </View>
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
    maxHeight: '85%',
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
    gap: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  switchHint: {
    fontSize: 12,
    marginTop: 2,
  },
  toggleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
    minHeight: 44,
  },
  toggleBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  chipText: {
    fontSize: 12,
  },
  previewContainer: {
    gap: 8,
    marginTop: 8,
  },
  previewBox: {
    height: 120,
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  previewContent: {
    flex: 1,
    alignItems: 'center',
  },
  previewText: {
    color: '#FFFFFF',
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
  },
});
