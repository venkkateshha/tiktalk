/**
 * TikTalk Phase 8: Notification Event Coordinator
 * Architecture boundary for real-time notifications, unread badge caching,
 * and cross-screen synchronization across BottomNav, WebSidebar, and Inbox.
 */

import { AppNotification, NotificationPreferences } from '../../domain/notification';

export type NotificationEventType =
  | 'notification_received'
  | 'notification_read'
  | 'all_read'
  | 'notification_deleted'
  | 'unread_count_changed'
  | 'preferences_updated';

export interface NotificationEvent {
  type: NotificationEventType;
  notificationId?: string;
  notification?: AppNotification;
  unreadCount?: number;
  preferences?: NotificationPreferences;
}

type NotificationListener = (event: NotificationEvent) => void;

class NotificationCoordinatorClass {
  private listeners: Set<NotificationListener> = new Set();
  private cachedUnreadCount: number = 0;
  private notificationsCache: Map<string, AppNotification> = new Map();

  /**
   * Subscribe to real-time notification events.
   * Returns an unsubscribe callback.
   */
  subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Broadcast an event to all subscribers with safe execution.
   */
  notify(event: NotificationEvent): void {
    if (typeof event.unreadCount === 'number') {
      this.cachedUnreadCount = Math.max(0, event.unreadCount);
    }

    if (event.type === 'notification_received' && event.notification) {
      this.notificationsCache.set(event.notification.id, event.notification);
    } else if (event.type === 'notification_read' && event.notificationId) {
      const existing = this.notificationsCache.get(event.notificationId);
      if (existing) {
        this.notificationsCache.set(event.notificationId, { ...existing, isRead: true });
      }
    } else if (event.type === 'all_read') {
      this.notificationsCache.forEach((notif, key) => {
        this.notificationsCache.set(key, { ...notif, isRead: true });
      });
      this.cachedUnreadCount = 0;
    } else if (event.type === 'notification_deleted' && event.notificationId) {
      this.notificationsCache.delete(event.notificationId);
    }

    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch {
        // Safe listener execution: subscriber failures do not crash coordinator
      }
    });
  }

  getUnreadCount(): number {
    return this.cachedUnreadCount;
  }

  setUnreadCount(count: number): void {
    this.cachedUnreadCount = Math.max(0, count);
    this.notify({
      type: 'unread_count_changed',
      unreadCount: this.cachedUnreadCount,
    });
  }

  clear(): void {
    this.cachedUnreadCount = 0;
    this.notificationsCache.clear();
    this.listeners.clear();
  }
}

export const NotificationCoordinator = new NotificationCoordinatorClass();
