/**
 * TikTalk Service Boundary: Notifications Service Contract
 */

import { AppNotification } from '../../domain/notification';

export interface INotificationsService {
  registerPushToken(token: string, platform: 'ios' | 'android' | 'web'): Promise<void>;
  getNotifications(limit?: number, offset?: number): Promise<AppNotification[]>;
  getUnreadCount(): Promise<number>;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(): Promise<void>;
}
