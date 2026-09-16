/**
 * TikTalk Phase 9: ChatThreadView Component
 * Renders the active message thread with participant header,
 * scrollable message bubbles, date group dividers, typing animation,
 * conversation safety actions (Mute, Archive, Block, Report), and composer.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Conversation, Message } from '../../../domain/chat';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { Avatar } from '../../../components/ui/Avatar';
import { A11yStandards } from '../../../core/a11y/a11yStandards';
import { useChatThread } from '../hooks/useChatThread';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { useCallContext } from '../../../features/calls/context/CallContext';

export interface ChatThreadViewProps {
  conversationId: string;
  onBack?: () => void;
  onProfilePress?: (userId: string) => void;
}

export const ChatThreadView: React.FC<ChatThreadViewProps> = ({
  conversationId,
  onBack,
  onProfilePress,
}) => {
  const { theme, typography } = useTheme();
  const [isMenuVisible, setIsMenuVisible] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const {
    messages,
    conversation,
    isLoading,
    replyingTo,
    isOtherTyping,
    sendMessage,
    retryMessage,
    deleteMessage,
    reactToMessage,
    setReplyingTo,
    blockConversation,
    reportConversation,
  } = useChatThread({ conversationId });

  const isDirect = conversation?.type === 'direct';
  const otherParticipant = isDirect
    ? conversation.participants.find((p) => p.userId !== 'me') || conversation.participants[0]
    : null;

  const title = isDirect
    ? otherParticipant?.user?.displayName || otherParticipant?.user?.username || 'Direct Message'
    : conversation?.title || 'Group Conversation';

  const isBlocked = conversation?.isBlocked || false;

  // Phase 10: Call initiation from chat
  const { startCall, activeCall } = useCallContext();
  const isCallActive = !!activeCall;

  const handleVoiceCall = () => {
    if (!otherParticipant || isCallActive) return;
    startCall(conversationId, 'audio', otherParticipant.userId).catch(() => {});
  };

  const handleVideoCall = () => {
    if (!otherParticipant || isCallActive) return;
    startCall(conversationId, 'video', otherParticipant.userId).catch(() => {});
  };

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const handleBlock = () => {
    setIsMenuVisible(false);
    blockConversation();
  };

  const handleReport = () => {
    setIsMenuVisible(false);
    reportConversation('Inappropriate content or spam');
  };

  const formatDateDivider = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      if (date.toDateString() === now.toDateString()) return 'Today';
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 1. Chat Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity
              style={[styles.backBtn, A11yStandards.minTouchTarget]}
              onPress={onBack}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Back to conversations"
            >
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.headerParticipant}
            onPress={() => otherParticipant && onProfilePress?.(otherParticipant.userId)}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`View profile of ${title}`}
          >
            <Avatar
              source={isDirect ? otherParticipant?.user?.avatarUrl : conversation?.avatarUrl}
              name={title}
              size="sm"
              isVerified={otherParticipant?.user?.verificationStatus === 'verified'}
            />
            <View style={styles.headerTitleCol}>
              <Text
                style={[
                  styles.headerTitle,
                  { color: theme.text, fontSize: typography.fontSize.sm },
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
              {isOtherTyping && (
                <Text style={[styles.typingText, { color: BrandColors.cyan, fontSize: typography.fontSize.xs }]}>
                  typing...
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Phase 10: Voice & Video call buttons — 1:1 direct conversations only */}
        {isDirect && otherParticipant && (
          <>
            <TouchableOpacity
              style={[styles.callBtn, A11yStandards.minTouchTarget, isCallActive && styles.callBtnDisabled]}
              onPress={handleVoiceCall}
              disabled={isCallActive}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={isCallActive ? 'Call in progress' : `Voice call ${title}`}
            >
              <Ionicons name="call-outline" size={20} color={isCallActive ? theme.textSecondary : BrandColors.cyan} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.callBtn, A11yStandards.minTouchTarget, isCallActive && styles.callBtnDisabled]}
              onPress={handleVideoCall}
              disabled={isCallActive}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={isCallActive ? 'Call in progress' : `Video call ${title}`}
            >
              <Ionicons name="videocam-outline" size={20} color={isCallActive ? theme.textSecondary : BrandColors.cyan} />
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[styles.menuBtn, A11yStandards.minTouchTarget]}
          onPress={() => setIsMenuVisible(true)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Conversation options"
        >
          <Ionicons name="ellipsis-vertical" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* 2. Messages List */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
      >
        {isLoading && messages.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={BrandColors.cyan} />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.surface }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={32} color={BrandColors.cyan} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text, fontSize: typography.fontSize.md }]}>
              Say hello to {title}!
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]}>
              Send a direct message to start this conversation.
            </Text>
          </View>
        ) : (
          messages.map((item, index) => {
            const isFirst = index === 0;
            const prevMessage = !isFirst ? messages[index - 1] : null;
            const showDateDivider =
              isFirst ||
              (prevMessage &&
                new Date(item.createdAt).toDateString() !==
                  new Date(prevMessage.createdAt).toDateString());

            return (
              <View key={item.id}>
                {showDateDivider && (
                  <View style={styles.dateDividerRow}>
                    <View style={[styles.dateDividerPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      <Text style={[styles.dateDividerText, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]}>
                        {formatDateDivider(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                )}

                <MessageBubble
                  message={item}
                  onRetry={retryMessage}
                  onReply={setReplyingTo}
                  onReact={reactToMessage}
                  onDelete={(id) => deleteMessage(id, false)}
                />
              </View>
            );
          })
        )}
      </ScrollView>

      {/* 3. Blocked Banner or Composer */}
      {isBlocked ? (
        <View style={[styles.blockedBanner, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <Ionicons name="shield-outline" size={18} color={BrandColors.pink} />
          <Text style={[styles.blockedText, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]}>
            You have blocked this conversation. Unblock from settings to message.
          </Text>
        </View>
      ) : (
        <MessageInput
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onSend={(text) => sendMessage(text)}
          disabled={isBlocked}
        />
      )}

      {/* 4. Options Modal (Block, Report, Mute) */}
      <Modal
        visible={isMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsMenuVisible(false)}
        >
          <View style={[styles.menuCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={handleBlock}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Block conversation"
            >
              <Ionicons name="ban-outline" size={20} color={BrandColors.pink} />
              <Text style={[styles.menuItemText, { color: BrandColors.pink, fontSize: typography.fontSize.sm }]}>
                Block User
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleReport}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Report conversation"
            >
              <Ionicons name="flag-outline" size={20} color={theme.text} />
              <Text style={[styles.menuItemText, { color: theme.text, fontSize: typography.fontSize.sm }]}>
                Report for Safety
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  headerParticipant: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitleCol: {
    marginLeft: 10,
    flex: 1,
  },
  headerTitle: {
    fontWeight: '700',
  },
  typingText: {
    fontWeight: '600',
    marginTop: 1,
  },
  menuBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingVertical: 12,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  centerContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    textAlign: 'center',
  },
  dateDividerRow: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateDividerPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateDividerText: {
    fontWeight: '600',
  },
  blockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  blockedText: {
    flex: 1,
    lineHeight: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  menuCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemText: {
    fontWeight: '600',
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtnDisabled: {
    opacity: 0.4,
  },
});
