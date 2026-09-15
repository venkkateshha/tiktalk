import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { Story, StoryReactionType } from '../types';

export interface StoryBottomBarProps {
  story: Story;
  isOwner: boolean;
  activeReaction?: StoryReactionType;
  onReact: (reaction: StoryReactionType) => void;
  onUnreact: () => void;
  onReply: (text: string, reaction?: StoryReactionType) => Promise<void>;
  onOpenViewers?: () => void;
  onAddToHighlight?: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

const REACTIONS: { type: StoryReactionType; icon: string; label: string; color?: string }[] = [
  { type: 'like', icon: 'thumbs-up', label: 'Like', color: '#25F4EE' },
  { type: 'love', icon: 'heart', label: 'Love', color: '#FE2C55' },
  { type: 'laugh', icon: 'happy', label: 'Laugh', color: '#FBBF24' },
  { type: 'wow', icon: 'flash', label: 'Wow', color: '#60A5FA' },
  { type: 'sad', icon: 'sad', label: 'Sad', color: '#9CA3AF' },
  { type: 'angry', icon: 'flame', label: 'Angry', color: '#EF4444' },
];

export const StoryBottomBar: React.FC<StoryBottomBarProps> = ({
  story,
  isOwner,
  activeReaction,
  onReact,
  onUnreact,
  onReply,
  onOpenViewers,
  onAddToHighlight,
  onPause,
  onResume,
}) => {
  const { typography, brandColors } = useTheme();
  const [replyText, setReplyText] = useState('');
  const [showReactionsPicker, setShowReactionsPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setIsSending(true);
    try {
      await onReply(replyText);
      setReplyText('');
    } finally {
      setIsSending(false);
      onResume?.();
    }
  };

  const handleReactionPress = (type: StoryReactionType) => {
    if (activeReaction === type) {
      onUnreact();
    } else {
      onReact(type);
    }
    setShowReactionsPicker(false);
    onResume?.();
  };

  if (isOwner) {
    // Owner Bottom Bar: Viewers count button & Highlights button
    return (
      <View style={styles.ownerContainer}>
        <TouchableOpacity
          onPress={onOpenViewers}
          style={styles.viewersPill}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Story viewed by ${story.viewCount} people. Tap to see viewers.`}
          activeOpacity={0.8}
        >
          <Ionicons name="eye-outline" size={18} color={brandColors.white} />
          <Text style={[styles.viewersCountText, { color: brandColors.white }]}>
            {story.viewCount} {story.viewCount === 1 ? 'view' : 'views'}
          </Text>
        </TouchableOpacity>

        {onAddToHighlight && (
          <TouchableOpacity
            onPress={onAddToHighlight}
            style={styles.highlightPill}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Add this story to profile highlights"
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={16} color={brandColors.cyan} />
            <Text style={[styles.highlightText, { color: brandColors.cyan }]}>Highlight</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Viewer Bottom Bar: Reply input + Quick Reactions
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.viewerContainer}
    >
      {/* Floating Reaction Picker */}
      {showReactionsPicker && (
        <View style={styles.reactionsPickerRow}>
          {REACTIONS.map((r) => {
            const isSelected = activeReaction === r.type;
            return (
              <TouchableOpacity
                key={r.type}
                onPress={() => handleReactionPress(r.type)}
                style={[
                  styles.reactionOption,
                  isSelected && { backgroundColor: 'rgba(255,255,255,0.2)', transform: [{ scale: 1.15 }] },
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={r.label}
              >
                <Ionicons
                  name={(isSelected ? r.icon : `${r.icon}-outline`) as any}
                  size={24}
                  color={r.color || brandColors.white}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.inputRow}>
        <View style={styles.replyInputSlot}>
          <TextInput
            value={replyText}
            onChangeText={setReplyText}
            placeholder={`Reply to @${story.creatorUsername}...`}
            placeholderTextColor="rgba(255, 255, 255, 0.55)"
            style={[styles.input, { color: brandColors.white, fontSize: typography.fontSize.sm }]}
            onFocus={onPause}
            onBlur={onResume}
            onSubmitEditing={handleSendReply}
            returnKeyType="send"
            accessible={true}
            accessibilityRole="none"
            accessibilityLabel="Reply text input"
          />
          {replyText.trim().length > 0 && (
            <TouchableOpacity
              onPress={handleSendReply}
              disabled={isSending}
              style={styles.sendButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Send reply"
            >
              <Ionicons name="send" size={18} color={brandColors.cyan} />
            </TouchableOpacity>
          )}
        </View>

        {/* Reaction Trigger Button */}
        <TouchableOpacity
          onPress={() => {
            setShowReactionsPicker((prev) => !prev);
            onPause?.();
          }}
          style={styles.reactionTriggerButton}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Story reactions"
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeReaction ? 'heart' : 'heart-outline'}
            size={26}
            color={activeReaction ? brandColors.pink : brandColors.white}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  ownerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 10,
    width: '100%',
  },
  viewersPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    minHeight: 44,
    minWidth: 44,
  },
  viewersCountText: {
    fontSize: 14,
    fontWeight: '600',
  },
  highlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(37, 244, 238, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(37, 244, 238, 0.4)',
    minHeight: 44,
    minWidth: 44,
  },
  highlightText: {
    fontSize: 14,
    fontWeight: '700',
  },
  viewerContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
  },
  reactionsPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  reactionOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  replyInputSlot: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
  },
  sendButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionTriggerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
