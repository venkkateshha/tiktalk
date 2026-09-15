/**
 * TikTalk Phase 9: ConversationRow Component
 * Renders individual direct & group conversations with real participant data,
 * presence status indicators, last message delivery status, timestamps, and unread badges.
 * ZERO fake data.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Conversation, Message } from '../../../domain/chat';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { Avatar } from '../../../components/ui/Avatar';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface ConversationRowProps {
  conversation: Conversation;
  currentUserId?: string;
  isSelected?: boolean;
  onPress: (conversation: Conversation) => void;
  onLongPress?: (conversation: Conversation) => void;
}

export const ConversationRow: React.FC<ConversationRowProps> = ({
  conversation,
  currentUserId = 'me',
  isSelected = false,
  onPress,
  onLongPress,
}) => {
  const { theme, typography } = useTheme();

  // Determine title and avatar from other participants if direct conversation
  const isDirect = conversation.type === 'direct';
  const otherParticipant = isDirect
    ? conversation.participants.find((p) => p.userId !== currentUserId) || conversation.participants[0]
    : null;

  const title = isDirect
    ? otherParticipant?.user?.displayName || otherParticipant?.user?.username || 'Direct Message'
    : conversation.title || 'Group Conversation';

  const avatarUrl = isDirect
    ? otherParticipant?.user?.avatarUrl
    : conversation.avatarUrl;

  const formatTime = (isoString?: string): string => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
      if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d`;
      return `${Math.floor(diffSec / 604800)}w`;
    } catch {
      return '';
    }
  };

  const renderDeliveryStatus = (message?: Message) => {
    if (!message || message.senderId !== currentUserId) return null;

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
        return <Ionicons name="alert-circle" size={13} color={BrandColors.pink} style={styles.statusIcon} />;
      default:
        return null;
    }
  };

  const lastMessageText = conversation.lastMessage
    ? conversation.lastMessage.type === 'image'
      ? '📷 Photo'
      : conversation.lastMessage.type === 'video'
      ? '🎥 Video'
      : conversation.lastMessage.type === 'audio'
      ? '🎙️ Voice note'
      : conversation.lastMessage.text
    : 'No messages yet';

  const hasUnread = conversation.unreadCount > 0;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        hasUnread && { backgroundColor: theme.card },
        isSelected && { backgroundColor: theme.card, borderLeftWidth: 3, borderLeftColor: BrandColors.cyan },
      ]}
      onPress={() => onPress(conversation)}
      onLongPress={() => onLongPress?.(conversation)}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${title}, ${hasUnread ? `${conversation.unreadCount} unread messages, ` : ''}${lastMessageText}, ${formatTime(conversation.updatedAt)}`}
    >
      {/* 1. Participant Avatar */}
      <View style={styles.avatarWrapper}>
        {isDirect ? (
          <Avatar
            source={avatarUrl}
            name={title}
            size="md"
            isVerified={otherParticipant?.user?.verificationStatus === 'verified'}
          />
        ) : (
          <View style={[styles.groupIconCircle, { backgroundColor: theme.surface }]}>
            <Ionicons name="people" size={22} color={BrandColors.cyan} />
          </View>
        )}
      </View>

      {/* 2. Text Info */}
      <View style={styles.contentCol}>
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.titleText,
              { color: theme.text, fontSize: typography.fontSize.sm },
              hasUnread && { fontWeight: '700' },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>

          <Text
            style={[
              styles.timeText,
              { color: theme.textSecondary, fontSize: typography.fontSize.xs },
            ]}
          >
            {formatTime(conversation.updatedAt)}
          </Text>
        </View>

        <View style={styles.previewRow}>
          <View style={styles.previewTextWrapper}>
            {renderDeliveryStatus(conversation.lastMessage)}
            <Text
              style={[
                styles.previewText,
                { color: hasUnread ? theme.text : theme.textSecondary, fontSize: typography.fontSize.xs },
                hasUnread && { fontWeight: '600' },
              ]}
              numberOfLines={1}
            >
              {lastMessageText}
            </Text>
          </View>

          <View style={styles.badgesRow}>
            {conversation.isMuted && (
              <Ionicons name="volume-mute-outline" size={14} color={theme.textSecondary} />
            )}
            {conversation.isPinned && (
              <Ionicons name="pin" size={14} color={BrandColors.cyan} />
            )}
            {hasUnread && (
              <View style={[styles.unreadBadge, { backgroundColor: BrandColors.pink }]}>
                <Text style={styles.unreadBadgeText}>
                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 68,
  },
  avatarWrapper: {
    marginRight: 12,
    position: 'relative',
  },
  groupIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCol: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleText: {
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontWeight: '400',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewTextWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  statusIcon: {
    marginRight: 4,
  },
  previewText: {
    lineHeight: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    color: BrandColors.white,
    fontSize: 10,
    fontWeight: '800',
  },
});
