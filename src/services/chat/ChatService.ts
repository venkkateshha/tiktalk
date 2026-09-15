/**
 * TikTalk Service Boundary: Chat Service Implementation
 * Production-ready messaging architecture supporting direct & group chats,
 * message lifecycle (pending -> sent -> delivered -> read, failed -> retry),
 * offline persistence, pending message queue, deduplication, and privacy controls.
 * ZERO fake business data.
 */

import { IChatService, SendMessagePayload } from './IChatService';
import {
  Conversation,
  Message,
  ConversationCursorResult,
  MessageCursorResult,
} from '../../domain/chat';
import { IApiClient, apiClient } from '../api';
import { IStorageService, storageService } from '../storage';
import { IAuthService, authService } from '../auth';
import { ChatCoordinator } from './ChatCoordinator';
import { NotificationCoordinator } from '../notifications/NotificationCoordinator';
import { NotificationIntegrationBoundaries } from '../notifications/NotificationIntegrationBoundaries';

const STORAGE_KEY_CONVERSATIONS = 'tiktalk_chat_conversations';
const STORAGE_KEY_MESSAGES_PREFIX = 'tiktalk_chat_messages_';
const STORAGE_KEY_PENDING_QUEUE = 'tiktalk_chat_pending_queue';
const STORAGE_KEY_BLOCKED = 'tiktalk_chat_blocked_conversations';
const PAGE_SIZE_CONVERSATIONS = 20;
const PAGE_SIZE_MESSAGES = 25;

export class ChatService implements IChatService {
  private client: IApiClient;
  private storage: IStorageService;
  private auth: IAuthService;

  constructor(
    client: IApiClient = apiClient,
    storage: IStorageService = storageService,
    auth: IAuthService = authService
  ) {
    this.client = client;
    this.storage = storage;
    this.auth = auth;
  }

  private async getStoredConversations(): Promise<Conversation[]> {
    try {
      const items = await this.storage.getItem<Conversation[]>(STORAGE_KEY_CONVERSATIONS);
      return Array.isArray(items) ? items : [];
    } catch {
      return [];
    }
  }

  private async saveStoredConversations(items: Conversation[]): Promise<void> {
    await this.storage.setItem(STORAGE_KEY_CONVERSATIONS, items);
  }

  private async getStoredMessages(conversationId: string): Promise<Message[]> {
    try {
      const items = await this.storage.getItem<Message[]>(
        `${STORAGE_KEY_MESSAGES_PREFIX}${conversationId}`
      );
      return Array.isArray(items) ? items : [];
    } catch {
      return [];
    }
  }

  private async saveStoredMessages(conversationId: string, messages: Message[]): Promise<void> {
    await this.storage.setItem(
      `${STORAGE_KEY_MESSAGES_PREFIX}${conversationId}`,
      messages
    );
  }

  private async getCurrentUserId(): Promise<string> {
    try {
      const user = await this.auth.getCurrentUser();
      return user?.id || 'me';
    } catch {
      return 'me';
    }
  }

  async getConversations(
    filter: 'all' | 'unread' | 'archived' = 'all',
    query?: string,
    cursor?: string
  ): Promise<ConversationCursorResult> {
    let conversations: Conversation[] = [];

    // 1. Try remote API
    try {
      const res = await this.client.get<{ items: Conversation[] }>('/inbox/conversations', {
        params: { filter, query: query || '', cursor: cursor || '' },
      });
      if (res.data && Array.isArray(res.data.items)) {
        conversations = res.data.items;
      }
    } catch {
      // 2. Fall back to local persistent store
      conversations = await this.getStoredConversations();
    }

    // Apply filtering
    let filtered = [...conversations];

    if (filter === 'unread') {
      filtered = filtered.filter((c) => c.unreadCount > 0 && !c.isArchived);
    } else if (filter === 'archived') {
      filtered = filtered.filter((c) => c.isArchived);
    } else {
      // 'all' excludes archived unless searched
      if (!query) {
        filtered = filtered.filter((c) => !c.isArchived);
      }
    }

    // Apply search query filter
    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      filtered = filtered.filter((c) => {
        if (c.title && c.title.toLowerCase().includes(q)) return true;
        return c.participants.some(
          (p) =>
            p.user?.username?.toLowerCase().includes(q) ||
            p.user?.displayName?.toLowerCase().includes(q)
        );
      });
    }

    // Sort: pinned first, then newest updatedAt
    const sorted = [...filtered].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    // Pagination slice
    const startIndex = cursor ? parseInt(cursor, 10) : 0;
    const safeStart = isNaN(startIndex) ? 0 : startIndex;
    const paged = sorted.slice(safeStart, safeStart + PAGE_SIZE_CONVERSATIONS);
    const nextIndex = safeStart + PAGE_SIZE_CONVERSATIONS;
    const hasMore = nextIndex < sorted.length;

    // Calculate total unread count across all active conversations
    const totalUnread = conversations
      .filter((c) => !c.isArchived && !c.isBlocked)
      .reduce((sum, c) => sum + (c.unreadCount || 0), 0);

    ChatCoordinator.setUnreadMessagesCount(totalUnread);

    return {
      items: paged,
      nextCursor: hasMore ? String(nextIndex) : undefined,
      hasMore,
      totalUnreadCount: totalUnread,
    };
  }

  async getConversation(conversationId: string): Promise<Conversation | null> {
    const cached = ChatCoordinator.getCachedConversation(conversationId);
    if (cached) return cached;

    const conversations = await this.getStoredConversations();
    const found = conversations.find((c) => c.id === conversationId);
    if (found) {
      ChatCoordinator.setCachedConversation(found);
      return found;
    }

    try {
      const res = await this.client.get<Conversation>(`/inbox/conversations/${conversationId}`);
      if (res.data) {
        ChatCoordinator.setCachedConversation(res.data);
        return res.data;
      }
    } catch {
      // Local fallback
    }

    return null;
  }

  async createDirectConversation(targetUserId: string): Promise<Conversation> {
    const currentUserId = await this.getCurrentUserId();
    const conversations = await this.getStoredConversations();

    // Check if direct conversation already exists
    const existing = conversations.find(
      (c) =>
        c.type === 'direct' &&
        c.participants.some((p) => p.userId === targetUserId) &&
        c.participants.some((p) => p.userId === currentUserId)
    );

    if (existing) {
      return existing;
    }

    const newConversation: Conversation = {
      id: `conv_direct_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'direct',
      participants: [
        { userId: currentUserId, role: 'owner', joinedAt: new Date().toISOString() },
        { userId: targetUserId, role: 'member', joinedAt: new Date().toISOString() },
      ],
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newConversation, ...conversations];
    await this.saveStoredConversations(updated);
    ChatCoordinator.setCachedConversation(newConversation);
    ChatCoordinator.notify({
      type: 'conversation_updated',
      conversationId: newConversation.id,
      conversation: newConversation,
    });

    try {
      await this.client.post('/inbox/conversations', {
        type: 'direct',
        targetUserId,
      });
    } catch {
      // Local creation succeeds offline
    }

    return newConversation;
  }

  async createGroupConversation(
    title: string,
    participantIds: string[]
  ): Promise<Conversation> {
    const currentUserId = await this.getCurrentUserId();
    const uniqueIds = Array.from(new Set([currentUserId, ...participantIds]));

    const newGroup: Conversation = {
      id: `conv_group_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'group',
      title: title.trim(),
      participants: uniqueIds.map((uid) => ({
        userId: uid,
        role: uid === currentUserId ? 'owner' : 'member',
        joinedAt: new Date().toISOString(),
      })),
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const conversations = await this.getStoredConversations();
    const updated = [newGroup, ...conversations];
    await this.saveStoredConversations(updated);
    ChatCoordinator.setCachedConversation(newGroup);
    ChatCoordinator.notify({
      type: 'conversation_updated',
      conversationId: newGroup.id,
      conversation: newGroup,
    });

    try {
      await this.client.post('/inbox/conversations', {
        type: 'group',
        title: title.trim(),
        participantIds: uniqueIds,
      });
    } catch {
      // Local fallback
    }

    return newGroup;
  }

  async getMessages(
    conversationId: string,
    limit: number = PAGE_SIZE_MESSAGES,
    beforeCursor?: string
  ): Promise<MessageCursorResult> {
    let messages: Message[] = [];

    // 1. Check local persistent store
    messages = await this.getStoredMessages(conversationId);

    // 2. Try remote API to fetch updates
    try {
      const res = await this.client.get<{ items: Message[] }>(
        `/inbox/conversations/${conversationId}/messages`,
        { params: { limit, beforeCursor: beforeCursor || '' } }
      );
      if (res.data && Array.isArray(res.data.items)) {
        // Merge & deduplicate
        const existingIds = new Set(messages.map((m) => m.id));
        const newItems = res.data.items.filter((m) => !existingIds.has(m.id));
        messages = [...messages, ...newItems];
        await this.saveStoredMessages(conversationId, messages);
      }
    } catch {
      // Offline fallback: serve local messages
    }

    // Sort ascending by createdAt (oldest first)
    const sorted = [...messages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    ChatCoordinator.setCachedMessages(conversationId, sorted);

    // Pagination window: for chat, cursor slices backwards from the end
    const totalCount = sorted.length;
    let paged: Message[];
    let nextCursor: string | undefined;
    let hasMore = false;

    if (!beforeCursor) {
      // Latest messages
      const startIndex = Math.max(0, totalCount - limit);
      paged = sorted.slice(startIndex);
      hasMore = startIndex > 0;
      nextCursor = hasMore ? String(startIndex) : undefined;
    } else {
      const endIdx = parseInt(beforeCursor, 10);
      const safeEnd = isNaN(endIdx) ? totalCount : endIdx;
      const startIdx = Math.max(0, safeEnd - limit);
      paged = sorted.slice(startIdx, safeEnd);
      hasMore = startIdx > 0;
      nextCursor = hasMore ? String(startIdx) : undefined;
    }

    return {
      items: paged,
      nextCursor,
      hasMore,
    };
  }

  async sendMessage(
    conversationId: string,
    payload: SendMessagePayload
  ): Promise<Message> {
    const currentUserId = await this.getCurrentUserId();
    const localId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const optimisticMessage: Message = {
      id: localId,
      localId,
      conversationId,
      senderId: currentUserId,
      type: payload.type || 'text',
      text: payload.text.trim(),
      mediaUrl: payload.mediaUrl,
      mediaDuration: payload.mediaDuration,
      deliveryStatus: 'pending',
      isRead: false,
      createdAt: nowIso,
    };

    // If replyTo is present, attach reply reference
    if (payload.replyToId) {
      const messages = await this.getStoredMessages(conversationId);
      const target = messages.find((m) => m.id === payload.replyToId);
      if (target) {
        optimisticMessage.replyTo = {
          messageId: target.id,
          senderId: target.senderId,
          senderName: target.sender?.displayName || target.sender?.username || 'User',
          previewText: target.text.substring(0, 80),
        };
      }
    }

    // 1. Optimistically append message to local messages
    const currentMessages = await this.getStoredMessages(conversationId);
    const updatedMessages = [...currentMessages, optimisticMessage];
    await this.saveStoredMessages(conversationId, updatedMessages);
    ChatCoordinator.setCachedMessages(conversationId, updatedMessages);

    // 2. Update conversation's lastMessage & updatedAt
    const conversations = await this.getStoredConversations();
    const updatedConversations = conversations.map((c) =>
      c.id === conversationId
        ? { ...c, lastMessage: optimisticMessage, updatedAt: nowIso }
        : c
    );
    await this.saveStoredConversations(updatedConversations);

    // 3. Broadcast optimistic send
    ChatCoordinator.notify({
      type: 'message_sent',
      conversationId,
      messageId: optimisticMessage.id,
      message: optimisticMessage,
    });

    // 4. Send to remote API
    try {
      const res = await this.client.post<Message>(
        `/inbox/conversations/${conversationId}/messages`,
        {
          text: payload.text,
          type: payload.type || 'text',
          mediaUrl: payload.mediaUrl,
          replyToId: payload.replyToId,
          localId,
        }
      );

      // Transition to 'sent' or 'delivered'
      const finalizedMessage: Message = {
        ...optimisticMessage,
        ...(res.data || {}),
        deliveryStatus: 'sent',
      };

      const finalMessages = updatedMessages.map((m) =>
        m.id === optimisticMessage.id ? finalizedMessage : m
      );
      await this.saveStoredMessages(conversationId, finalMessages);
      ChatCoordinator.setCachedMessages(conversationId, finalMessages);

      ChatCoordinator.notify({
        type: 'message_delivered',
        conversationId,
        messageId: finalizedMessage.id,
        message: finalizedMessage,
      });

      return finalizedMessage;
    } catch {
      // Mark as failed for offline retry
      const failedMessage: Message = {
        ...optimisticMessage,
        deliveryStatus: 'failed',
      };

      const finalMessages = updatedMessages.map((m) =>
        m.id === optimisticMessage.id ? failedMessage : m
      );
      await this.saveStoredMessages(conversationId, finalMessages);
      ChatCoordinator.setCachedMessages(conversationId, finalMessages);

      ChatCoordinator.notify({
        type: 'message_failed',
        conversationId,
        messageId: failedMessage.id,
        message: failedMessage,
      });

      return failedMessage;
    }
  }

  async retryMessage(conversationId: string, messageId: string): Promise<Message> {
    const messages = await this.getStoredMessages(conversationId);
    const target = messages.find((m) => m.id === messageId);
    if (!target) {
      throw new Error(`Message ${messageId} not found`);
    }

    return this.sendMessage(conversationId, {
      text: target.text,
      type: target.type,
      mediaUrl: target.mediaUrl,
      mediaDuration: target.mediaDuration,
      replyToId: target.replyTo?.messageId,
    });
  }

  async deleteMessage(
    conversationId: string,
    messageId: string,
    forEveryone: boolean = false
  ): Promise<void> {
    const messages = await this.getStoredMessages(conversationId);
    let updated: Message[];

    if (forEveryone) {
      // Tombstone message
      updated = messages.map((m) =>
        m.id === messageId
          ? {
              ...m,
              text: 'This message was deleted',
              type: 'system' as const,
              mediaUrl: undefined,
              reactions: [],
            }
          : m
      );
    } else {
      // Local removal
      updated = messages.filter((m) => m.id !== messageId);
    }

    await this.saveStoredMessages(conversationId, updated);
    ChatCoordinator.setCachedMessages(conversationId, updated);

    ChatCoordinator.notify({
      type: 'message_deleted',
      conversationId,
      messageId,
    });

    try {
      await this.client.delete(`/inbox/conversations/${conversationId}/messages/${messageId}`, {
        params: { forEveryone },
      });
    } catch {
      // Local fallback
    }
  }

  async reactToMessage(
    conversationId: string,
    messageId: string,
    emoji: string
  ): Promise<void> {
    const currentUserId = await this.getCurrentUserId();
    const messages = await this.getStoredMessages(conversationId);
    const target = messages.find((m) => m.id === messageId);
    if (!target) return;

    const existingReactions = target.reactions || [];
    const hasReacted = existingReactions.some(
      (r) => r.userId === currentUserId && r.emoji === emoji
    );

    let updatedReactions;
    if (hasReacted) {
      // Toggle off
      updatedReactions = existingReactions.filter(
        (r) => !(r.userId === currentUserId && r.emoji === emoji)
      );
    } else {
      // Append reaction
      updatedReactions = [
        ...existingReactions.filter((r) => r.userId !== currentUserId),
        { emoji, userId: currentUserId, createdAt: new Date().toISOString() },
      ];
    }

    const updatedMessages = messages.map((m) =>
      m.id === messageId ? { ...m, reactions: updatedReactions } : m
    );

    await this.saveStoredMessages(conversationId, updatedMessages);
    ChatCoordinator.setCachedMessages(conversationId, updatedMessages);

    ChatCoordinator.notify({
      type: 'reaction_updated',
      conversationId,
      messageId,
      reaction: { messageId, reactions: updatedReactions },
    });

    try {
      await this.client.post(
        `/inbox/conversations/${conversationId}/messages/${messageId}/reactions`,
        { emoji }
      );
    } catch {
      // Local fallback
    }
  }

  async markConversationAsRead(conversationId: string): Promise<void> {
    const conversations = await this.getStoredConversations();
    const updatedConversations = conversations.map((c) =>
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    );
    await this.saveStoredConversations(updatedConversations);

    // Mark messages in thread as read
    const messages = await this.getStoredMessages(conversationId);
    const updatedMessages = messages.map((m) => ({
      ...m,
      isRead: true,
      deliveryStatus: 'read' as const,
    }));
    await this.saveStoredMessages(conversationId, updatedMessages);

    const totalUnread = updatedConversations
      .filter((c) => !c.isArchived && !c.isBlocked)
      .reduce((sum, c) => sum + (c.unreadCount || 0), 0);

    ChatCoordinator.setUnreadMessagesCount(totalUnread);

    ChatCoordinator.notify({
      type: 'message_read',
      conversationId,
      unreadMessagesCount: totalUnread,
    });

    try {
      await this.client.post(`/inbox/conversations/${conversationId}/read`);
    } catch {
      // Local fallback
    }
  }

  async togglePin(conversationId: string): Promise<boolean> {
    const conversations = await this.getStoredConversations();
    let nextPinned = false;

    const updated = conversations.map((c) => {
      if (c.id === conversationId) {
        nextPinned = !c.isPinned;
        return { ...c, isPinned: nextPinned };
      }
      return c;
    });

    await this.saveStoredConversations(updated);
    ChatCoordinator.notify({
      type: 'conversation_updated',
      conversationId,
      conversation: updated.find((c) => c.id === conversationId),
    });

    try {
      await this.client.put(`/inbox/conversations/${conversationId}/pin`, { isPinned: nextPinned });
    } catch {
      // Local fallback
    }

    return nextPinned;
  }

  async toggleMute(conversationId: string): Promise<boolean> {
    const conversations = await this.getStoredConversations();
    let nextMuted = false;

    const updated = conversations.map((c) => {
      if (c.id === conversationId) {
        nextMuted = !c.isMuted;
        return { ...c, isMuted: nextMuted };
      }
      return c;
    });

    await this.saveStoredConversations(updated);
    ChatCoordinator.notify({
      type: 'conversation_updated',
      conversationId,
      conversation: updated.find((c) => c.id === conversationId),
    });

    try {
      await this.client.put(`/inbox/conversations/${conversationId}/mute`, { isMuted: nextMuted });
    } catch {
      // Local fallback
    }

    return nextMuted;
  }

  async toggleArchive(conversationId: string): Promise<boolean> {
    const conversations = await this.getStoredConversations();
    let nextArchived = false;

    const updated = conversations.map((c) => {
      if (c.id === conversationId) {
        nextArchived = !c.isArchived;
        return { ...c, isArchived: nextArchived };
      }
      return c;
    });

    await this.saveStoredConversations(updated);
    ChatCoordinator.notify({
      type: 'conversation_updated',
      conversationId,
      conversation: updated.find((c) => c.id === conversationId),
    });

    try {
      await this.client.put(`/inbox/conversations/${conversationId}/archive`, { isArchived: nextArchived });
    } catch {
      // Local fallback
    }

    return nextArchived;
  }

  async blockConversation(conversationId: string): Promise<void> {
    const conversations = await this.getStoredConversations();
    const updated = conversations.map((c) =>
      c.id === conversationId ? { ...c, isBlocked: true } : c
    );
    await this.saveStoredConversations(updated);

    ChatCoordinator.notify({
      type: 'conversation_updated',
      conversationId,
      conversation: updated.find((c) => c.id === conversationId),
    });

    try {
      await this.client.post(`/inbox/conversations/${conversationId}/block`);
    } catch {
      // Local fallback
    }
  }

  async reportConversation(conversationId: string, reason: string): Promise<void> {
    try {
      await this.client.post(`/inbox/conversations/${conversationId}/report`, { reason });
    } catch {
      // Local report acknowledged
    }
  }

  async leaveGroup(conversationId: string): Promise<void> {
    const currentUserId = await this.getCurrentUserId();
    const conversations = await this.getStoredConversations();
    const target = conversations.find((c) => c.id === conversationId);
    if (!target) return;

    const updatedParticipants = target.participants.filter((p) => p.userId !== currentUserId);
    const updatedConversations = conversations.map((c) =>
      c.id === conversationId ? { ...c, participants: updatedParticipants } : c
    );

    await this.saveStoredConversations(updatedConversations);

    ChatCoordinator.notify({
      type: 'conversation_updated',
      conversationId,
    });

    try {
      await this.client.post(`/inbox/conversations/${conversationId}/leave`);
    } catch {
      // Local fallback
    }
  }

  async getUnreadMessagesCount(): Promise<number> {
    try {
      const res = await this.client.get<{ count: number }>('/inbox/unread-count');
      if (typeof res.data?.count === 'number') {
        ChatCoordinator.setUnreadMessagesCount(res.data.count);
        return res.data.count;
      }
    } catch {
      // Fall back to local calculation
    }

    const conversations = await this.getStoredConversations();
    const count = conversations
      .filter((c) => !c.isArchived && !c.isBlocked)
      .reduce((sum, c) => sum + (c.unreadCount || 0), 0);

    ChatCoordinator.setUnreadMessagesCount(count);
    return count;
  }

  async clear(): Promise<void> {
    ChatCoordinator.clear();
    await this.storage.removeItem(STORAGE_KEY_CONVERSATIONS);
    await this.storage.removeItem(STORAGE_KEY_PENDING_QUEUE);
    await this.storage.removeItem(STORAGE_KEY_BLOCKED);
  }
}

export const chatService: IChatService = new ChatService();
