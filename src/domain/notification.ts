/**
 * TikTalk Domain: Notifications & Activity
 */

import { User } from './user';

export type NotificationType =
  | 'like'
  | 'comment'
  | 'mention'
  | 'follow'
  | 'system'
  | 'monetization'
  | 'story_reply'
  | 'story_view'
  | 'story_reaction'
  | 'story_expiry';

export interface AppNotification {
  id: string;
  recipientId: string;
  senderId?: string;
  sender?: User;
  type: NotificationType;
  title: string;
  body: string;
  targetId?: string; // ID of post, comment, or transaction
  targetType?: 'post' | 'comment' | 'profile' | 'wallet' | 'story';
  isRead: boolean;
  createdAt: string;
}
