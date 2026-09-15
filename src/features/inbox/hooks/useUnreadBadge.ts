/**
 * TikTalk Phase 9: useUnreadBadge Hook
 * Lightweight reactive hook for navigation indicators (BottomNav, WebSidebar).
 * Combines real unread counts from both NotificationCoordinator (Activity)
 * and ChatCoordinator (Direct & Group Messages).
 * Zero fake counts.
 */

import { useState, useEffect } from 'react';
import {
  NotificationCoordinator,
  notificationsService,
} from '../../../services/notifications';
import {
  ChatCoordinator,
  chatService,
  ChatEvent,
} from '../../../services/chat';

export interface UseUnreadBadgeReturn {
  unreadCount: number;
  activityUnreadCount: number;
  messagesUnreadCount: number;
  hasUnread: boolean;
  badgeText: string;
}

export function useUnreadBadge(): UseUnreadBadgeReturn {
  const [activityUnread, setActivityUnread] = useState<number>(() =>
    NotificationCoordinator.getUnreadCount()
  );
  const [messagesUnread, setMessagesUnread] = useState<number>(() =>
    ChatCoordinator.getUnreadMessagesCount()
  );

  useEffect(() => {
    // 1. Initial fetch of notifications unread count
    notificationsService.getUnreadCount().then((count: number) => {
      setActivityUnread(count);
    }).catch(() => {});

    // 2. Initial fetch of messages unread count
    chatService.getUnreadMessagesCount().then((count: number) => {
      setMessagesUnread(count);
    }).catch(() => {});

    // 3. Subscribe to NotificationCoordinator events
    const unsubNotif = NotificationCoordinator.subscribe((event) => {
      if (typeof event.unreadCount === 'number') {
        setActivityUnread(event.unreadCount);
      }
    });

    // 4. Subscribe to ChatCoordinator events
    const unsubChat = ChatCoordinator.subscribe((event: ChatEvent) => {
      if (typeof event.unreadMessagesCount === 'number') {
        setMessagesUnread(event.unreadMessagesCount);
      }
    });

    return () => {
      unsubNotif();
      unsubChat();
    };
  }, []);

  const totalUnread = activityUnread + messagesUnread;
  const hasUnread = totalUnread > 0;
  const badgeText = totalUnread > 99 ? '99+' : totalUnread > 0 ? String(totalUnread) : '';

  return {
    unreadCount: totalUnread,
    activityUnreadCount: activityUnread,
    messagesUnreadCount: messagesUnread,
    hasUnread,
    badgeText,
  };
}
