/**
 * TikTalk Phase 9: MessageInput Component
 * Multiline chat composer with reply banner preview, attachment trigger,
 * and send action meeting accessibility touch standards.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../../../domain/chat';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface MessageInputProps {
  replyingTo: Message | null;
  onCancelReply: () => void;
  onSend: (text: string) => void;
  onAttachMedia?: () => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  replyingTo,
  onCancelReply,
  onSend,
  onAttachMedia,
  disabled = false,
}) => {
  const { theme, typography } = useTheme();
  const [text, setText] = useState<string>('');

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  const hasText = text.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
      {/* 1. Replying Quote Banner */}
      {replyingTo && (
        <View style={[styles.replyBanner, { backgroundColor: theme.card, borderLeftColor: BrandColors.cyan }]}>
          <View style={styles.replyContent}>
            <Text style={[styles.replySender, { color: BrandColors.cyan, fontSize: typography.fontSize.xs }]}>
              Replying to {replyingTo.sender?.displayName || replyingTo.sender?.username || 'User'}
            </Text>
            <Text style={[styles.replyText, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]} numberOfLines={1}>
              {replyingTo.text}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.closeReplyBtn, A11yStandards.minTouchTarget]}
            onPress={onCancelReply}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Cancel reply"
          >
            <Ionicons name="close" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* 2. Input Bar */}
      <View style={styles.inputRow}>
        {/* Attachment button */}
        <TouchableOpacity
          style={[styles.actionBtn, A11yStandards.minTouchTarget]}
          onPress={onAttachMedia}
          disabled={disabled}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Attach media"
        >
          <Ionicons name="add-circle-outline" size={24} color={disabled ? theme.border : theme.text} />
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: theme.background,
              color: theme.text,
              borderColor: theme.border,
              fontSize: typography.fontSize.sm,
            },
          ]}
          placeholder={disabled ? 'Messaging unavailable' : 'Message...'}
          placeholderTextColor={theme.textSecondary}
          value={text}
          onChangeText={setText}
          multiline={true}
          maxLength={1000}
          editable={!disabled}
          accessible={true}
          accessibilityLabel="Message input field"
        />

        {/* Send Button */}
        <TouchableOpacity
          style={[
            styles.sendBtn,
            A11yStandards.minTouchTarget,
            {
              backgroundColor: hasText && !disabled ? BrandColors.cyan : theme.border,
            },
          ]}
          onPress={handleSend}
          disabled={!hasText || disabled}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Ionicons
            name="arrow-up"
            size={20}
            color={hasText && !disabled ? BrandColors.black : theme.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 3,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  replyContent: {
    flex: 1,
    marginRight: 8,
  },
  replySender: {
    fontWeight: '700',
    marginBottom: 2,
  },
  replyText: {
    lineHeight: 14,
  },
  closeReplyBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  actionBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});
