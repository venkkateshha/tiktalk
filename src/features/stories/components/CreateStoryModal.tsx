import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { StoryType, StoryAudience } from '../types';
import { useStoryCreation, BACKGROUND_PRESETS } from '../hooks/useStoryCreation';

export interface CreateStoryModalProps {
  visible: boolean;
  onClose: () => void;
  onStoryCreated?: () => void;
}

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  visible,
  onClose,
  onStoryCreated,
}) => {
  const { brandColors, typography, theme } = useTheme();
  const creation = useStoryCreation(() => {
    onStoryCreated?.();
    onClose();
  });

  const [mentionInput, setMentionInput] = useState('');
  const [showMentionField, setShowMentionField] = useState(false);

  const handleClose = () => {
    if (creation.textContent.trim().length > 0 || creation.mediaUri) {
      // Form is dirty
      creation.reset();
    }
    onClose();
  };

  const handleAddMention = () => {
    if (mentionInput.trim()) {
      creation.addMention(mentionInput.trim());
      setMentionInput('');
      setShowMentionField(false);
    }
  };

  const handlePublish = async () => {
    try {
      await creation.publish();
    } catch {
      // Error handled by hook
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: creation.type === 'text' ? creation.textBackground : brandColors.black },
        ]}
      >
        {/* Top Navigation Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.iconButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Close story creator"
          >
            <Ionicons name="close" size={26} color={brandColors.white} />
          </TouchableOpacity>

          {/* Type Selector (Photo / Video / Text) */}
          <View style={styles.typeSelector}>
            {(['text', 'photo', 'video'] as StoryType[]).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => creation.setType(t)}
                style={[
                  styles.typeTab,
                  creation.type === t && { backgroundColor: 'rgba(255,255,255,0.25)' },
                ]}
                accessible={true}
                accessibilityRole="tab"
                accessibilityLabel={`${t} story mode`}
              >
                <Text
                  style={[
                    styles.typeTabText,
                    {
                      color: creation.type === t ? brandColors.cyan : brandColors.white,
                      fontWeight: creation.type === t ? '700' : '500',
                    },
                  ]}
                >
                  {t.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Publish Button */}
          <TouchableOpacity
            onPress={handlePublish}
            disabled={creation.isPublishing}
            style={[
              styles.publishButton,
              {
                backgroundColor:
                  creation.type === 'text' && !creation.textContent.trim()
                    ? 'rgba(255,255,255,0.2)'
                    : brandColors.cyan,
              },
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Publish story"
          >
            {creation.isPublishing ? (
              <ActivityIndicator color={brandColors.black} size="small" />
            ) : (
              <Text style={[styles.publishButtonText, { color: brandColors.black }]}>
                Share
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Story Canvas / Editor */}
        <View style={styles.canvasArea}>
          {creation.type === 'text' ? (
            <View style={styles.textEditorCenter}>
              <TextInput
                value={creation.textContent}
                onChangeText={creation.setTextContent}
                placeholder="Type your story..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                multiline={true}
                maxLength={300}
                style={[
                  styles.textStoryInput,
                  {
                    color: creation.textColor,
                    fontSize: typography.fontSize.xl,
                  },
                ]}
                autoFocus={true}
                accessible={true}
                accessibilityRole="none"
                accessibilityLabel="Story text input"
              />

              {/* Mentions list */}
              {creation.mentions.length > 0 && (
                <View style={styles.mentionsRow}>
                  {creation.mentions.map((m) => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => creation.removeMention(m)}
                      style={styles.mentionChip}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove mention ${m}`}
                    >
                      <Text style={[styles.mentionText, { color: brandColors.cyan }]}>{m}</Text>
                      <Ionicons name="close-circle" size={14} color={brandColors.cyan} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.mediaPlaceholder}>
              <Ionicons
                name={creation.type === 'video' ? 'videocam-outline' : 'image-outline'}
                size={72}
                color={brandColors.cyan}
              />
              <Text style={[styles.mediaPlaceholderTitle, { color: brandColors.white }]}>
                {creation.type === 'video' ? 'Video Story' : 'Photo Story'}
              </Text>
              <Text style={styles.mediaPlaceholderSubtitle}>
                Select an asset from your library to share
              </Text>

              <TouchableOpacity
                onPress={() => {
                  // Simulate photo/video attachment
                  creation.setMediaUri('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800');
                }}
                style={[styles.selectMediaButton, { backgroundColor: brandColors.cyan }]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Select media asset"
              >
                <Text style={{ color: brandColors.black, fontWeight: '700' }}>Select Media</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Inline Mention Input Field */}
          {showMentionField && (
            <View style={styles.mentionInputCard}>
              <TextInput
                value={mentionInput}
                onChangeText={setMentionInput}
                placeholder="username (without @)"
                placeholderTextColor="rgba(255,255,255,0.5)"
                style={styles.mentionTextInput}
                autoFocus={true}
                onSubmitEditing={handleAddMention}
                accessible={true}
                accessibilityRole="none"
                accessibilityLabel="Username mention input"
              />
              <TouchableOpacity
                onPress={handleAddMention}
                style={[styles.addMentionBtn, { backgroundColor: brandColors.cyan }]}
              >
                <Text style={{ color: brandColors.black, fontWeight: '700' }}>Add</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Error notice if any */}
          {creation.error && (
            <View style={styles.errorNotice}>
              <Text style={styles.errorText}>{creation.error}</Text>
            </View>
          )}
        </View>

        {/* Bottom Styling & Privacy Controls */}
        <View style={styles.bottomControls}>
          {/* Background color palette (for Text stories) */}
          {creation.type === 'text' && (
            <View style={styles.backgroundPalettes}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {BACKGROUND_PRESETS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => creation.setTextBackground(color)}
                    style={[
                      styles.colorDot,
                      { backgroundColor: color },
                      creation.textBackground === color && styles.activeColorDot,
                    ]}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Background color ${color}`}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Tools row: Mention button + Audience picker */}
          <View style={styles.toolsRow}>
            <TouchableOpacity
              onPress={() => setShowMentionField((prev) => !prev)}
              style={styles.toolPill}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Add mention"
            >
              <Ionicons name="at" size={18} color={brandColors.cyan} />
              <Text style={[styles.toolPillText, { color: brandColors.white }]}>Mention</Text>
            </TouchableOpacity>

            {/* Audience Picker */}
            <View style={styles.audienceSelector}>
              {(['everyone', 'followers', 'close_friends'] as StoryAudience[]).map((aud) => {
                const isSelected = creation.audience === aud;
                const label =
                  aud === 'everyone' ? 'Public' : aud === 'followers' ? 'Followers' : 'Close Friends';
                return (
                  <TouchableOpacity
                    key={aud}
                    onPress={() => creation.setAudience(aud)}
                    style={[
                      styles.audienceOption,
                      isSelected && {
                        backgroundColor: aud === 'close_friends' ? '#10B981' : brandColors.cyan,
                      },
                    ]}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Audience ${label}`}
                  >
                    <Text
                      style={[
                        styles.audienceOptionText,
                        {
                          color: isSelected ? brandColors.black : 'rgba(255,255,255,0.7)',
                          fontWeight: isSelected ? '700' : '400',
                        },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    height: 60,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 3,
  },
  typeTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeTabText: {
    fontSize: 12,
  },
  publishButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    minHeight: 36,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  canvasArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    position: 'relative',
  },
  textEditorCenter: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textStoryInput: {
    width: '100%',
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 34,
    minHeight: 120,
  },
  mediaPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  mediaPlaceholderTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  mediaPlaceholderSubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    textAlign: 'center',
  },
  selectMediaButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mentionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  mentionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(37, 244, 238, 0.15)',
  },
  mentionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  mentionInputCard: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  mentionTextInput: {
    color: '#FFFFFF',
    fontSize: 14,
    minWidth: 160,
    height: 38,
  },
  addMentionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  errorNotice: {
    position: 'absolute',
    bottom: 10,
    backgroundColor: 'rgba(254, 44, 85, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomControls: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
  },
  backgroundPalettes: {
    flexDirection: 'row',
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  activeColorDot: {
    borderColor: '#25F4EE',
    borderWidth: 3,
    transform: [{ scale: 1.15 }],
  },
  toolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  toolPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    minHeight: 44,
  },
  toolPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  audienceSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 3,
  },
  audienceOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audienceOptionText: {
    fontSize: 12,
  },
});
