/**
 * TikTalk Phase 9: useChatThread Hook
 * Reactive state management for active conversation threads, message delivery states,
 * pagination, optimistic sending, retries, replies, reactions, and typing indicators.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Message, Conversation, MessageType } from '../../../domain/chat';
import { IChatService, chatService, ChatCoordinator } from '../../../services/chat';

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

  // Subscribe to ChatCoordinator
  useEffect(() => {
    const unsubscribe = ChatCoordinator.subscribe((event) => {
      if (event.conversationId !== conversationId) return;

      if (event.type === 'message_sent' && event.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === event.message!.id || (m.localId && m.localId === event.message!.localId))) {
            return prev;
          }
          return [...prev, event.message!];
        });
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
  }, [conversationId]);

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

      try {
        await service.sendMessage(conversationId, {
          text,
          type,
          mediaUrl,
          replyToId,
        });
      } catch {
        // Safe execution
      }
    },
    [conversationId, replyingTo, service]
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
