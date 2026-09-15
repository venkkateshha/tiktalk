/**
 * TikTalk Service Boundary: Notifications Service Contract
 */

import {
  AppNotification,
  NotificationCategory,
  NotificationCursorResult,
  NotificationPreferences,
  NotificationType,
  NotificationTargetType,
} from '../../domain/notification';

export type PushPermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface PushNotificationPayload {
  title: string;
  body: string;
  type?: NotificationType;
  targetId?: string;
  targetType?: NotificationTargetType;
  data?: Record<string, unknown>;
}

export interface INotificationsService {
  registerPushToken(token: string, platform: 'ios' | 'android' | 'web'): Promise<void>;
  unregisterPushToken(): Promise<void>;
  getPushPermissionStatus(): Promise<PushPermissionStatus>;
  requestPushPermission(): Promise<PushPermissionStatus>;
  handlePushEvent(payload: PushNotificationPayload): Promise<AppNotification | null>;
  getNotifications(category?: NotificationCategory, cursor?: string): Promise<NotificationCursorResult>;
  getUnreadCount(): Promise<number>;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(): Promise<void>;
  deleteNotification(notificationId: string): Promise<void>;
  getPreferences(): Promise<NotificationPreferences>;
  updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences>;
  pushNotification(notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>): Promise<AppNotification>;
  clear(): Promise<void>;
}
