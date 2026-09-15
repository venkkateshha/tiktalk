/**
 * TikTalk Domain: Notifications & Activity
 * Production-ready typed contracts for activity feeds, categories, preferences, and deep-links.
 */

import { User } from './user';

/**
 * Exactly 15 defined and validated notification types
 */
export type NotificationType =
  | 'like'
  | 'comment'
  | 'reply'
  | 'mention'
  | 'follow'
  | 'repost'
  | 'story_reply'
  | 'story_view'
  | 'story_reaction'
  | 'live'
  | 'message'
  | 'security'
  | 'monetization'
  | 'announcement'
  | 'system';

export const ALL_NOTIFICATION_TYPES: NotificationType[] = [
  'like',
  'comment',
  'reply',
  'mention',
  'follow',
  'repost',
  'story_reply',
  'story_view',
  'story_reaction',
  'live',
  'message',
  'security',
  'monetization',
  'announcement',
  'system',
];

/**
 * User-facing activity categories / filters
 */
export type NotificationCategory =
  | 'all'
  | 'likes'
  | 'comments'
  | 'mentions'
  | 'followers'
  | 'stories'
  | 'live'
  | 'messages'
  | 'earnings'
  | 'security'
  | 'system';

export interface NotificationCategoryItem {
  key: NotificationCategory;
  label: string;
}

export const NOTIFICATION_CATEGORIES: NotificationCategoryItem[] = [
  { key: 'all', label: 'All Activity' },
  { key: 'likes', label: 'Likes' },
  { key: 'comments', label: 'Comments' },
  { key: 'mentions', label: 'Mentions' },
  { key: 'followers', label: 'Followers' },
  { key: 'stories', label: 'Stories' },
  { key: 'live', label: 'Live' },
  { key: 'messages', label: 'Messages' },
  { key: 'earnings', label: 'Earnings' },
  { key: 'security', label: 'Security' },
  { key: 'system', label: 'System' },
];

/**
 * Deterministic mapping from NotificationType to UI NotificationCategory
 */
export function mapNotificationTypeToCategory(type: NotificationType): NotificationCategory {
  switch (type) {
    case 'like':
      return 'likes';
    case 'comment':
    case 'reply':
      return 'comments';
    case 'mention':
      return 'mentions';
    case 'follow':
      return 'followers';
    case 'repost':
      return 'all';
    case 'story_reply':
    case 'story_view':
    case 'story_reaction':
      return 'stories';
    case 'live':
      return 'live';
    case 'message':
      return 'messages';
    case 'monetization':
      return 'earnings';
    case 'security':
      return 'security';
    case 'announcement':
    case 'system':
      return 'system';
    default:
      return 'all';
  }
}

export type NotificationTargetType =
  | 'post'
  | 'comment'
  | 'profile'
  | 'wallet'
  | 'story'
  | 'live'
  | 'chat'
  | 'message'
  | 'earnings'
  | 'settings'
  | 'external';

export interface NotificationTarget {
  type: NotificationTargetType;
  id?: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

export interface AppNotification {
  id: string;
  recipientId: string;
  senderId?: string;
  sender?: User;
  type: NotificationType;
  title: string;
  body: string;
  targetId?: string;
  targetType?: NotificationTargetType;
  target?: NotificationTarget;
  thumbnailUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationCursorResult {
  items: AppNotification[];
  nextCursor?: string;
  hasMore: boolean;
  unreadCount: number;
}

export interface NotificationPreferences {
  likes: boolean;
  comments: boolean;
  mentions: boolean;
  followers: boolean;
  stories: boolean;
  live: boolean;
  messages: boolean;
  earnings: boolean;
  security: boolean; // Immutable true for security alerts
  system: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  likes: true,
  comments: true,
  mentions: true,
  followers: true,
  stories: true,
  live: true,
  messages: true,
  earnings: true,
  security: true,
  system: true,
};

export type NotificationDateGroup = 'Today' | 'Yesterday' | 'Earlier';

export interface GroupedNotifications {
  group: NotificationDateGroup;
  items: AppNotification[];
}
