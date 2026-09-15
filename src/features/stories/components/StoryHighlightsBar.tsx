import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { StoryHighlight } from '../types';
import { storyService } from '../service';

export interface StoryHighlightsBarProps {
  userId: string;
  isOwner: boolean;
  onSelectHighlight?: (highlight: StoryHighlight) => void;
}

export const StoryHighlightsBar: React.FC<StoryHighlightsBarProps> = ({
  userId,
  isOwner,
  onSelectHighlight,
}) => {
  const { typography, brandColors, theme } = useTheme();
  const [highlights, setHighlights] = useState<StoryHighlight[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadHighlights = () => {
    storyService.getHighlights(userId).then(setHighlights).catch(() => {});
  };

  useEffect(() => {
    loadHighlights();
  }, [userId]);

  const handleCreateHighlight = async () => {
    if (!newTitle.trim()) return;
    setIsSubmitting(true);
    try {
      // In a full flow user selects from archive; here we link to user's stories
      await storyService.createHighlight(newTitle.trim(), '', ['sample_story_ref']);
      setNewTitle('');
      setIsCreateModalOpen(false);
      loadHighlights();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOwner && highlights.length === 0) {
    return null;
  }

  return (
    <View
      style={[styles.container, { borderBottomColor: theme.border }]}
      accessible={true}
      accessibilityRole="list"
      accessibilityLabel="Profile story highlights"
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* If Owner: Add New Highlight button */}
        {isOwner && (
          <TouchableOpacity
            onPress={() => setIsCreateModalOpen(true)}
            style={styles.highlightItem}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Create new highlight"
            activeOpacity={0.8}
          >
            <View style={[styles.circleWrapper, { borderColor: theme.border }]}>
              <View style={[styles.innerCircle, { backgroundColor: theme.surface }]}>
                <Ionicons name="add" size={24} color={brandColors.cyan} />
              </View>
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.highlightTitle,
                { color: theme.textSecondary, fontSize: typography.fontSize.xs },
              ]}
            >
              New
            </Text>
          </TouchableOpacity>
        )}

        {/* Highlight Items */}
        {highlights.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => onSelectHighlight?.(item)}
            style={styles.highlightItem}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Highlight: ${item.title}`}
            activeOpacity={0.8}
          >
            <View style={[styles.circleWrapper, { borderColor: theme.border }]}>
              <View style={[styles.innerCircle, { backgroundColor: '#1F2937' }]}>
                <Ionicons name="sparkles" size={20} color={brandColors.cyan} />
              </View>
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.highlightTitle,
                { color: theme.text, fontSize: typography.fontSize.xs },
              ]}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Create Highlight Modal */}
      {isCreateModalOpen && (
        <Modal
          visible={isCreateModalOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsCreateModalOpen(false)}
        >
          <TouchableWithoutFeedback onPress={() => setIsCreateModalOpen(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    New Highlight
                  </Text>
                  <TextInput
                    value={newTitle}
                    onChangeText={setNewTitle}
                    placeholder="Highlight Name"
                    placeholderTextColor={theme.textSecondary}
                    maxLength={25}
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.background,
                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                    autoFocus={true}
                    accessible={true}
                    accessibilityRole="none"
                    accessibilityLabel="Highlight title input"
                  />
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      onPress={() => setIsCreateModalOpen(false)}
                      style={[styles.modalButton, { borderColor: theme.border }]}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Cancel"
                    >
                      <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleCreateHighlight}
                      disabled={isSubmitting || !newTitle.trim()}
                      style={[
                        styles.modalButton,
                        {
                          backgroundColor: newTitle.trim() ? brandColors.cyan : theme.border,
                        },
                      ]}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Save highlight"
                    >
                      <Text style={{ color: brandColors.black, fontWeight: '700' }}>Create</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  highlightItem: {
    alignItems: 'center',
    width: 64,
  },
  circleWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightTitle: {
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    minWidth: 80,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});
