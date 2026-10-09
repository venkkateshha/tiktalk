/**
 * TikTalk Phase 9: useChatThread Hook
 * Reactive state management for active conversation threads, message delivery states,
 * pagination, optimistic sending, retries, replies, reactions, and typing indicators.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Message, Conversation, MessageType } from '../../../domain/chat';
import {
  IChatService,
  chatService,
  ChatCoordinator,
  firestoreChatRealtimeGateway,
} from '../../../services/chat';

export interface UseChatThreadProps {
  conversationId: string;
  service?: IChatService;
}

export interface UseChatThreadReturn {
  messages: Message[];
  conversation: Conversation | null;
  isLoading: boolean;
  hasMore: boolean;
  replyingTo: Message | null;
  isOtherTyping: boolean;
  errorMessage: string | null;
  loadMoreMessages: () => Promise<void>;
  sendMessage: (text: string, type?: MessageType, mediaUrl?: string) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string, forEveryone?: boolean) => Promise<void>;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
  setReplyingTo: (message: Message | null) => void;
  markAsRead: () => Promise<void>;
  blockConversation: () => Promise<void>;
  reportConversation: (reason: string) => Promise<void>;
}

export function useChatThread({
  conversationId,
  service = chatService,
}: UseChatThreadProps): UseChatThreadReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isOtherTyping, setIsOtherTyping] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load conversation details and messages
  const loadThread = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [conv, msgResult] = await Promise.all([
        service.getConversation(conversationId),
        service.getMessages(conversationId),
      ]);
      setConversation(conv);
      setMessages(msgResult.items);
      setHasMore(msgResult.hasMore);
      setNextCursor(msgResult.nextCursor);

      // Auto mark read upon opening
      await service.markConversationAsRead(conversationId);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, service]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  // Remote Firestore Realtime conversation-scoped subscription
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribeRealtime = firestoreChatRealtimeGateway.subscribeToConversation(
      conversationId,
      (event: any) => {
        if (event.conversationId !== conversationId) return;

        if (event.type === 'message_received') {
          const raw = event.message || event.data;
          if (!raw) return;

          const incoming: Message = raw.conversation_id
            ? {
                id: raw.id,
                conversationId: raw.conversation_id,
                senderId: raw.sender_id,
                sender: raw.sender
                  ? {
                      id: raw.sender.id,
                      username: raw.sender.username,
                      displayName: raw.sender.display_name,
                      avatarUrl: raw.sender.avatar_url || undefined,
                      verificationStatus: raw.sender.verification_status || 'none',
                      isCreator: Boolean(raw.sender.is_creator),
                      createdAt: raw.sender.created_at || new Date().toISOString(),
                    }
                  : undefined,
                type: raw.type || 'text',
                text: raw.text || '',
                mediaUrl: raw.media_url || undefined,
                mediaDuration: raw.media_duration ? Number(raw.media_duration) : undefined,
                deliveryStatus: raw.delivery_status || 'sent',
                isRead: raw.delivery_status === 'read',
                replyTo: raw.reply_to_id
                  ? { messageId: raw.reply_to_id, senderId: '', senderName: '', previewText: '' }
                  : undefined,
                reactions: [],
                localId: raw.local_id || undefined,
                createdAt: raw.created_at || new Date().toISOString(),
              }
            : raw;

          ChatCoordinator.notify({
            type: 'message_received',
            conversationId,
            messageId: incoming.id,
            message: incoming,
          });
        } else if (event.type === 'typing') {
          ChatCoordinator.notify({
            type: 'typing_changed',
            conversationId,
            typing: {
              conversationId,
              userId: event.userId || '',
              username: event.username || '',
              isTyping: Boolean(event.data?.isTyping ?? event.isTyping),
            },
          });
        }
      }
    );

    return () => {
      unsubscribeRealtime();
    };
  }, [conversationId]);

  // Subscribe to ChatCoordinator
  useEffect(() => {
    const unsubscribe = ChatCoordinator.subscribe((event) => {
      if (event.conversationId !== conversationId) return;

      if (
        (event.type === 'message_sent' || event.type === 'message_received') &&
        event.message
      ) {
        setMessages((prev) => {
          if (
            prev.some(
              (m) =>
                m.id === event.message!.id ||
                (m.localId && event.message!.localId && m.localId === event.message!.localId)
            )
          ) {
            return prev;
          }
          return [...prev, event.message!];
        });

        if (event.type === 'message_received') {
          service.markConversationAsRead(conversationId).catch(() => {});
        }
      } else if (
        (event.type === 'message_delivered' || event.type === 'message_failed') &&
        event.message
      ) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === event.message!.id || (m.localId && m.localId === event.message!.localId)
              ? event.message!
              : m
          )
        );
      } else if (event.type === 'message_read') {
        setMessages((prev) =>
          prev.map((m) => ({ ...m, isRead: true, deliveryStatus: 'read' as const }))
        );
      } else if (event.type === 'message_deleted' && event.messageId) {
        setMessages((prev) => prev.filter((m) => m.id !== event.messageId));
      } else if (event.type === 'reaction_updated' && event.reaction) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === event.reaction!.messageId
              ? { ...m, reactions: event.reaction!.reactions }
              : m
          )
        );
      } else if (event.type === 'typing_changed' && event.typing) {
        setIsOtherTyping(event.typing.isTyping);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (event.typing.isTyping) {
          typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000);
        }
      }
    });

    return () => {
      unsubscribe();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, service]);

  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || !nextCursor || isLoading) return;
    try {
      const result = await service.getMessages(conversationId, 25, nextCursor);
      setMessages((prev) => [...result.items, ...prev]);
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
    } catch {
      // Safe execution
    }
  }, [conversationId, hasMore, nextCursor, isLoading, service]);

  const sendMessage = useCallback(
    async (text: string, type: MessageType = 'text', mediaUrl?: string) => {
      if (!text.trim() && !mediaUrl) return;

      const replyToId = replyingTo?.id;
      setReplyingTo(null);
      setErrorMessage(null);

      try {
        let recipientId: string | undefined;
        if (conversation?.type === 'direct' && Array.isArray(conversation.participants)) {
          const currentUid = (service as any).currentAuthenticatedUser?.id;
          const other = conversation.participants.find((p: any) => {
            const pid = typeof p === 'string' ? p : p?.userId;
            return pid && pid !== currentUid;
          });
          if (other) {
            recipientId = typeof other === 'string' ? other : other.userId;
          }
        }

        await service.sendMessage(conversationId, {
          text,
          type,
          mediaUrl,
          replyToId,
          recipientId,
        });
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to send message');
      }
    },
    [conversationId, conversation, replyingTo, service]
  );

  const retryMessage = useCallback(
    async (messageId: string) => {
      try {
        await service.retryMessage(conversationId, messageId);
      } catch {
        // Safe execution
      }
    },
    [conversationId, service]
  );

  const deleteMessage = useCallback(
    async (messageId: string, forEveryone: boolean = false) => {
      try {
        await service.deleteMessage(conversationId, messageId, forEveryone);
      } catch {
        // Safe execution
      }
    },
    [conversationId, service]
  );

  const reactToMessage = useCallback(
    async (messageId: string, emoji: string) => {
      try {
        await service.reactToMessage(conversationId, messageId, emoji);
      } catch {
        // Safe execution
      }
    },
    [conversationId, service]
  );

  const markAsRead = useCallback(async () => {
    try {
      await service.markConversationAsRead(conversationId);
    } catch {
      // Safe execution
    }
  }, [conversationId, service]);

  const blockConversation = useCallback(async () => {
    try {
      await service.blockConversation(conversationId);
      setConversation((prev) => (prev ? { ...prev, isBlocked: true } : null));
    } catch {
      // Safe execution
    }
  }, [conversationId, service]);

  const reportConversation = useCallback(
    async (reason: string) => {
      try {
        await service.reportConversation(conversationId, reason);
      } catch {
        // Safe execution
      }
    },
    [conversationId, service]
  );

  return {
    messages,
    conversation,
    isLoading,
    hasMore,
    replyingTo,
    isOtherTyping,
    errorMessage,
    loadMoreMessages,
    sendMessage,
    retryMessage,
    deleteMessage,
    reactToMessage,
    setReplyingTo,
    markAsRead,
    blockConversation,
    reportConversation,
  };
}
