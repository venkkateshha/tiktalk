/**
 * TikTalk Domain: Chat & Direct/Group Messaging
 * Production-ready typed contracts for 1:1 direct conversations, group chats,
 * message delivery lifecycle, reactions, replies, presence, and safety controls.
 * ZERO fake business data.
 */

import { User } from './user';

export type ConversationType = 'direct' | 'group';

export type MessageDeliveryStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'story_reply'
  | 'system';

export interface MessageReaction {
  emoji: string;
  userId: string;
  createdAt: string;
}

export interface MessageReplyRef {
  messageId: string;
  senderId: string;
  senderName: string;
  previewText: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  type: MessageType;
  text: string;
  mediaUrl?: string;
  mediaDuration?: number;
  deliveryStatus: MessageDeliveryStatus;
  isRead: boolean;
  readBy?: string[];
  reactions?: MessageReaction[];
  replyTo?: MessageReplyRef;
  createdAt: string;
  updatedAt?: string;
  localId?: string; // Client-side identifier for optimistic sending and deduplication
}

export type GroupParticipantRole = 'owner' | 'admin' | 'member';

export interface GroupParticipant {
  userId: string;
  user?: User;
  role: GroupParticipantRole;
  joinedAt: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title?: string;
  avatarUrl?: string;
  participants: GroupParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  isBlocked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PresenceStatus = 'online' | 'away' | 'offline';

export interface UserPresence {
  userId: string;
  status: PresenceStatus;
  lastSeenAt?: string;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  username: string;
  isTyping: boolean;
}

export interface ConversationCursorResult {
  items: Conversation[];
  nextCursor?: string;
  hasMore: boolean;
  totalUnreadCount: number;
}

export interface MessageCursorResult {
  items: Message[];
  nextCursor?: string;
  hasMore: boolean;
}
