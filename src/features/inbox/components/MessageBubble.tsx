/**
 * TikTalk Phase 9: MessageBubble Component
 * High-quality message bubble supporting incoming/outgoing alignment,
 * delivery states (pending, sent, delivered, read, failed + retry),
 * reply quote previews, emoji reactions, and accessibility labels.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../../../domain/chat';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface MessageBubbleProps {
  message: Message;
  currentUserId?: string;
  onRetry?: (messageId: string) => void;
  onReply?: (message: Message) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onDelete?: (messageId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  currentUserId = 'me',
  onRetry,
  onReply,
  onReact,
  onDelete,
}) => {
  const { theme, typography } = useTheme();
  const isOutgoing = message.senderId === currentUserId;

  const formatTime = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      return `${formattedHours}:${formattedMinutes} ${ampm}`;
    } catch {
      return '';
    }
  };

  const renderStatusIcon = () => {
    if (!isOutgoing) return null;

    switch (message.deliveryStatus) {
      case 'pending':
        return <Ionicons name="time-outline" size={13} color={theme.textSecondary} style={styles.statusIcon} />;
      case 'sent':
        return <Ionicons name="checkmark" size={13} color={theme.textSecondary} style={styles.statusIcon} />;
      case 'delivered':
        return <Ionicons name="checkmark-done" size={13} color={theme.textSecondary} style={styles.statusIcon} />;
      case 'read':
        return <Ionicons name="checkmark-done" size={13} color={BrandColors.cyan} style={styles.statusIcon} />;
      case 'failed':
        return (
          <TouchableOpacity
            onPress={() => onRetry?.(message.id)}
            style={styles.retryTouch}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Failed to send message, tap to retry"
          >
            <Ionicons name="alert-circle" size={15} color={BrandColors.pink} />
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  return (
    <View
      style={[
        styles.rowContainer,
        isOutgoing ? styles.rowOutgoing : styles.rowIncoming,
      ]}
      accessible={true}
      accessibilityLabel={`${isOutgoing ? 'You' : message.sender?.displayName || 'User'}: ${message.text}, sent at ${formatTime(message.createdAt)}, status ${message.deliveryStatus}`}
    >
      <View
        style={[
          styles.bubble,
          isOutgoing
            ? [
                styles.bubbleOutgoing,
                {
                  backgroundColor: theme.card,
                  borderColor: BrandColors.cyan,
                },
              ]
            : [
                styles.bubbleIncoming,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ],
        ]}
      >
        {/* Reply Quote Reference Banner if present */}
        {message.replyTo && (
          <View style={[styles.replyQuote, { borderLeftColor: BrandColors.cyan, backgroundColor: theme.background }]}>
            <Text style={[styles.replyQuoteSender, { color: BrandColors.cyan, fontSize: typography.fontSize.xs }]}>
              {message.replyTo.senderName}
            </Text>
            <Text
              style={[styles.replyQuoteText, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]}
              numberOfLines={1}
            >
              {message.replyTo.previewText}
            </Text>
          </View>
        )}

        {/* Message Text */}
        <Text
          style={[
            styles.messageText,
            {
              color: theme.text,
              fontSize: typography.fontSize.sm,
            },
          ]}
        >
          {message.text}
        </Text>

        {/* Footer: Timestamp & Delivery Status */}
        <View style={styles.footerRow}>
          <Text style={[styles.timestamp, { color: theme.textSecondary, fontSize: 10 }]}>
            {formatTime(message.createdAt)}
          </Text>
          {renderStatusIcon()}
        </View>

        {/* Reactions Row if present */}
        {message.reactions && message.reactions.length > 0 && (
          <View style={styles.reactionsContainer}>
            {message.reactions.map((r, i) => (
              <TouchableOpacity
                key={`${r.emoji}_${i}`}
                style={[styles.reactionBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => onReact?.(message.id, r.emoji)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Reacted ${r.emoji}`}
              >
                <Text style={styles.reactionEmoji}>{r.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rowContainer: {
    marginVertical: 4,
    paddingHorizontal: 14,
    flexDirection: 'row',
  },
  rowOutgoing: {
    justifyContent: 'flex-end',
  },
  rowIncoming: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  bubbleOutgoing: {
    borderBottomRightRadius: 4,
  },
  bubbleIncoming: {
    borderBottomLeftRadius: 4,
  },
  replyQuote: {
    borderLeftWidth: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 6,
  },
  replyQuoteSender: {
    fontWeight: '700',
    marginBottom: 2,
  },
  replyQuoteText: {
    lineHeight: 14,
  },
  messageText: {
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  timestamp: {
    fontWeight: '500',
  },
  statusIcon: {
    marginLeft: 2,
  },
  retryTouch: {
    padding: 2,
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  reactionEmoji: {
    fontSize: 12,
  },
});
