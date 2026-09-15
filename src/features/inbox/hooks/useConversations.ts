/**
 * TikTalk Phase 9: useConversations Hook
 * Reactive state management for conversation lists, filtering, search,
 * pinning, muting, archiving, and real-time updates via ChatCoordinator.
 * ZERO fake conversations.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Conversation } from '../../../domain/chat';
import { IChatService, chatService, ChatCoordinator } from '../../../services/chat';

export interface UseConversationsReturn {
  conversations: Conversation[];
  filteredConversations: Conversation[];
  activeFilter: 'all' | 'unread' | 'archived';
  searchQuery: string;
  isLoading: boolean;
  isRefreshing: boolean;
  totalUnreadMessages: number;
  errorMessage: string | null;
  setActiveFilter: (filter: 'all' | 'unread' | 'archived') => void;
  setSearchQuery: (query: string) => void;
  refresh: () => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  toggleMute: (id: string) => Promise<void>;
  toggleArchive: (id: string) => Promise<void>;
  createDirectConversation: (targetUserId: string) => Promise<Conversation>;
  createGroupConversation: (title: string, participantIds: string[]) => Promise<Conversation>;
  markAsRead: (id: string) => Promise<void>;
}

export function useConversations(service: IChatService = chatService): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeFilter, setActiveFilterState] = useState<'all' | 'unread' | 'archived'>('all');
  const [searchQuery, setSearchQueryState] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState<number>(() =>
    ChatCoordinator.getUnreadMessagesCount()
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchConversations = useCallback(
    async (filter: 'all' | 'unread' | 'archived', query: string, isSilent = false) => {
      if (!isSilent) setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await service.getConversations(filter, query);
        setConversations(result.items);
        setTotalUnreadMessages(result.totalUnreadCount);
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to load conversations');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [service]
  );

  useEffect(() => {
    fetchConversations(activeFilter, searchQuery);
  }, [activeFilter, searchQuery, fetchConversations]);

  // Subscribe to real-time coordinator events
  useEffect(() => {
    const unsubscribe = ChatCoordinator.subscribe((event) => {
      if (typeof event.unreadMessagesCount === 'number') {
        setTotalUnreadMessages(event.unreadMessagesCount);
      }

      if (event.type === 'conversation_updated' && event.conversation) {
        setConversations((prev) => {
          const index = prev.findIndex((c) => c.id === event.conversation!.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = event.conversation!;
            return updated;
          }
          return [event.conversation!, ...prev];
        });
      } else if (event.type === 'message_sent' || event.type === 'message_received') {
        // Re-fetch conversations to update lastMessage and ordering
        fetchConversations(activeFilter, searchQuery, true);
      }
    });

    return unsubscribe;
  }, [activeFilter, searchQuery, fetchConversations]);

  const setActiveFilter = useCallback((filter: 'all' | 'unread' | 'archived') => {
    setActiveFilterState(filter);
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchConversations(activeFilter, searchQuery, true);
  }, [activeFilter, searchQuery, fetchConversations]);

  const togglePin = useCallback(
    async (id: string) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
      );
      try {
        await service.togglePin(id);
      } catch {
        // Safe execution
      }
    },
    [service]
  );

  const toggleMute = useCallback(
    async (id: string) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isMuted: !c.isMuted } : c))
      );
      try {
        await service.toggleMute(id);
      } catch {
        // Safe execution
      }
    },
    [service]
  );

  const toggleArchive = useCallback(
    async (id: string) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isArchived: !c.isArchived } : c))
      );
      try {
        await service.toggleArchive(id);
      } catch {
        // Safe execution
      }
    },
    [service]
  );

  const createDirectConversation = useCallback(
    async (targetUserId: string): Promise<Conversation> => {
      const conv = await service.createDirectConversation(targetUserId);
      setConversations((prev) => {
        if (prev.some((c) => c.id === conv.id)) return prev;
        return [conv, ...prev];
      });
      return conv;
    },
    [service]
  );

  const createGroupConversation = useCallback(
    async (title: string, participantIds: string[]): Promise<Conversation> => {
      const conv = await service.createGroupConversation(title, participantIds);
      setConversations((prev) => [conv, ...prev]);
      return conv;
    },
    [service]
  );

  const markAsRead = useCallback(
    async (id: string) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
      );
      try {
        await service.markConversationAsRead(id);
      } catch {
        // Safe execution
      }
    },
    [service]
  );

  const filteredConversations = useMemo(() => {
    return conversations;
  }, [conversations]);

  return {
    conversations,
    filteredConversations,
    activeFilter,
    searchQuery,
    isLoading,
    isRefreshing,
    totalUnreadMessages,
    errorMessage,
    setActiveFilter,
    setSearchQuery,
    refresh,
    togglePin,
    toggleMute,
    toggleArchive,
    createDirectConversation,
    createGroupConversation,
    markAsRead,
  };
}
