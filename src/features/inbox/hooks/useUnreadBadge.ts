/**
 * TikTalk Phase 8: useUnreadBadge Hook
 * Lightweight reactive hook for navigation indicators (BottomNav, WebSidebar).
 * Automatically updates when real notifications are received, read, or deleted.
 * Zero fake counts.
 */

import { useState, useEffect } from 'react';
import {
  NotificationCoordinator,
  notificationsService,
} from '../../../services/notifications';

export interface UseUnreadBadgeReturn {
  unreadCount: number;
  hasUnread: boolean;
  badgeText: string;
}

export function useUnreadBadge(): UseUnreadBadgeReturn {
  const [unreadCount, setUnreadCount] = useState<number>(() =>
    NotificationCoordinator.getUnreadCount()
  );

  useEffect(() => {
    // Initial fetch of unread count if 0
    notificationsService.getUnreadCount().then((count) => {
      setUnreadCount(count);
    }).catch(() => {});

    // Subscribe to real-time coordinator events
    const unsubscribe = NotificationCoordinator.subscribe((event) => {
      if (typeof event.unreadCount === 'number') {
        setUnreadCount(event.unreadCount);
      }
    });

    return unsubscribe;
  }, []);

  const hasUnread = unreadCount > 0;
  const badgeText = unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : '';

  return {
    unreadCount,
    hasUnread,
    badgeText,
  };
}
