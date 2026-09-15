/**
 * TikTalk Phase 9: Chat Event Coordinator
 * Global event coordinator and memory cache for chat threads, message delivery,
 * optimistic updates, typing indicators, presence, and unread direct message counts.
 */

import {
  Conversation,
  Message,
  TypingIndicator,
  UserPresence,
  MessageReaction,
} from '../../domain/chat';

export type ChatEventType =
  | 'message_sent'
  | 'message_received'
  | 'message_delivered'
  | 'message_read'
  | 'message_failed'
  | 'message_deleted'
  | 'reaction_updated'
  | 'typing_changed'
  | 'presence_changed'
  | 'conversation_updated'
  | 'unread_messages_count_changed';

export interface ChatEvent {
  type: ChatEventType;
  conversationId?: string;
  messageId?: string;
  message?: Message;
  conversation?: Conversation;
  typing?: TypingIndicator;
  presence?: UserPresence;
  reaction?: { messageId: string; reactions: MessageReaction[] };
  unreadMessagesCount?: number;
}

type ChatListener = (event: ChatEvent) => void;

class ChatCoordinatorClass {
  private listeners: Set<ChatListener> = new Set();
  private cachedUnreadMessagesCount: number = 0;
  private conversationsCache: Map<string, Conversation> = new Map();
  private activeMessagesCache: Map<string, Message[]> = new Map();

  /**
   * Subscribe to global chat events
   */
  subscribe(listener: ChatListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Broadcast an event to all subscribers with safe execution
   */
  notify(event: ChatEvent): void {
    if (typeof event.unreadMessagesCount === 'number') {
      this.cachedUnreadMessagesCount = Math.max(0, event.unreadMessagesCount);
    }

    if (event.conversation) {
      this.conversationsCache.set(event.conversation.id, event.conversation);
    }

    if (event.conversationId && event.message && event.type === 'message_received') {
      const existing = this.activeMessagesCache.get(event.conversationId) || [];
      // Deduplicate by ID
      if (!existing.some((m) => m.id === event.message!.id || (m.localId && m.localId === event.message!.localId))) {
        this.activeMessagesCache.set(event.conversationId, [...existing, event.message]);
      }
    }

    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch {
        // Safe listener execution: subscriber failures do not crash coordinator
      }
    });
  }

  getUnreadMessagesCount(): number {
    return this.cachedUnreadMessagesCount;
  }

  setUnreadMessagesCount(count: number): void {
    this.cachedUnreadMessagesCount = Math.max(0, count);
    this.notify({
      type: 'unread_messages_count_changed',
      unreadMessagesCount: this.cachedUnreadMessagesCount,
    });
  }

  getCachedConversation(id: string): Conversation | undefined {
    return this.conversationsCache.get(id);
  }

  setCachedConversation(conversation: Conversation): void {
    this.conversationsCache.set(conversation.id, conversation);
  }

  getCachedMessages(conversationId: string): Message[] | undefined {
    return this.activeMessagesCache.get(conversationId);
  }

  setCachedMessages(conversationId: string, messages: Message[]): void {
    this.activeMessagesCache.set(conversationId, messages);
  }

  getState() {
    return {
      unreadTotal: this.cachedUnreadMessagesCount,
    };
  }

  clear(): void {
    this.cachedUnreadMessagesCount = 0;
    this.conversationsCache.clear();
    this.activeMessagesCache.clear();
    this.listeners.clear();
  }
}

export const ChatCoordinator = new ChatCoordinatorClass();
export const chatCoordinator = ChatCoordinator;
