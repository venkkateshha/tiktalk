/**
 * TikTalk Service Boundary: Chat Service Contract
 * Production-ready contract for direct & group conversations, message delivery lifecycle,
 * optimistic updates, message reactions, replies, and privacy controls.
 */

import {
  Conversation,
  Message,
  MessageType,
  ConversationCursorResult,
  MessageCursorResult,
} from '../../domain/chat';

export interface SendMessagePayload {
  text: string;
  type?: MessageType;
  mediaUrl?: string;
  mediaDuration?: number;
  replyToId?: string;
}

export interface IChatService {
  /**
   * Fetch conversations list with optional filter and search query
   */
  getConversations(
    filter?: 'all' | 'unread' | 'archived',
    query?: string,
    cursor?: string
  ): Promise<ConversationCursorResult>;

  /**
   * Get a specific conversation by ID
   */
  getConversation(conversationId: string): Promise<Conversation | null>;

  /**
   * Create or retrieve an existing direct (1:1) conversation
   */
  createDirectConversation(targetUserId: string): Promise<Conversation>;

  /**
   * Create a group conversation
   */
  createGroupConversation(title: string, participantIds: string[]): Promise<Conversation>;

  /**
   * Fetch paginated messages in a conversation
   */
  getMessages(
    conversationId: string,
    limit?: number,
    beforeCursor?: string
  ): Promise<MessageCursorResult>;

  /**
   * Send a new message (optimistically delivered, stored locally, synched to backend)
   */
  sendMessage(conversationId: string, payload: SendMessagePayload): Promise<Message>;

  /**
   * Retry sending a previously failed message
   */
  retryMessage(conversationId: string, messageId: string): Promise<Message>;

  /**
   * Delete a message (locally and/or for everyone)
   */
  deleteMessage(conversationId: string, messageId: string, forEveryone?: boolean): Promise<void>;

  /**
   * Add or toggle an emoji reaction on a message
   */
  reactToMessage(conversationId: string, messageId: string, emoji: string): Promise<void>;

  /**
   * Mark all unread messages in a conversation as read
   */
  markConversationAsRead(conversationId: string): Promise<void>;

  /**
   * Toggle pinned status for a conversation
   */
  togglePin(conversationId: string): Promise<boolean>;

  /**
   * Toggle muted alerts for a conversation
   */
  toggleMute(conversationId: string): Promise<boolean>;

  /**
   * Toggle archive status for a conversation
   */
  toggleArchive(conversationId: string): Promise<boolean>;

  /**
   * Block a conversation / user
   */
  blockConversation(conversationId: string): Promise<void>;

  /**
   * Report a conversation or user for abuse/safety
   */
  reportConversation(conversationId: string, reason: string): Promise<void>;

  /**
   * Leave a group conversation
   */
  leaveGroup(conversationId: string): Promise<void>;

  /**
   * Get total unread direct message count across all conversations
   */
  getUnreadMessagesCount(): Promise<number>;

  /**
   * Clear local chat state (e.g. on logout or testing)
   */
  clear(): Promise<void>;
}
