/**
 * TikTalk Phase 8: useNotifications Hook
 * Manages category filtering, cursor pagination, date grouping (Today, Yesterday, Earlier),
 * real-time event updates via NotificationCoordinator, and read/delete actions.
 * Zero fake notifications.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AppNotification,
  NotificationCategory,
  GroupedNotifications,
  mapNotificationTypeToCategory,
} from '../../../domain/notification';
import {
  INotificationsService,
  notificationsService,
  NotificationCoordinator,
} from '../../../services/notifications';

export interface UseNotificationsProps {
  initialCategory?: NotificationCategory;
  service?: INotificationsService;
}

export interface UseNotificationsReturn {
  notifications: AppNotification[];
  groupedNotifications: GroupedNotifications[];
  unreadCount: number;
  category: NotificationCategory;
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  errorMessage: string | null;
  setCategory: (cat: NotificationCategory) => void;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

export function useNotifications({
  initialCategory = 'all',
  service = notificationsService,
}: UseNotificationsProps = {}): UseNotificationsReturn {
  const [category, setCategoryState] = useState<NotificationCategory>(initialCategory);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(() =>
    NotificationCoordinator.getUnreadCount()
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchNotifications = useCallback(
    async (targetCategory: NotificationCategory, cursor?: string, isAppend = false) => {
      if (!isAppend) {
        setIsLoading(true);
        setErrorMessage(null);
      }

      try {
        const result = await service.getNotifications(targetCategory, cursor);
        setNotifications((prev) => (isAppend ? [...prev, ...result.items] : result.items));
        setHasMore(result.hasMore);
        setNextCursor(result.nextCursor);
        setUnreadCount(result.unreadCount);
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to load activity');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [service]
  );

  useEffect(() => {
    fetchNotifications(category);
  }, [category, fetchNotifications]);

  // Subscribe to NotificationCoordinator for real-time updates
  useEffect(() => {
    const unsubscribe = NotificationCoordinator.subscribe((event) => {
      if (typeof event.unreadCount === 'number') {
        setUnreadCount(event.unreadCount);
      }

      if (event.type === 'notification_received' && event.notification) {
        const matchesCategory =
          category === 'all' ||
          mapNotificationTypeToCategory(event.notification.type) === category;

        if (matchesCategory) {
          setNotifications((prev) => [event.notification!, ...prev]);
        }
      } else if (event.type === 'notification_read' && event.notificationId) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === event.notificationId ? { ...n, isRead: true } : n
          )
        );
      } else if (event.type === 'all_read') {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } else if (event.type === 'notification_deleted' && event.notificationId) {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== event.notificationId)
        );
      }
    });

    return unsubscribe;
  }, [category]);

  const setCategory = useCallback((newCat: NotificationCategory) => {
    setCategoryState(newCat);
  }, []);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchNotifications(category);
  }, [category, fetchNotifications]);

  const loadMore = useCallback(async () => {
    if (hasMore && nextCursor && !isLoading) {
      await fetchNotifications(category, nextCursor, true);
    }
  }, [category, fetchNotifications, hasMore, nextCursor, isLoading]);

  const markAsRead = useCallback(
    async (id: string) => {
      // Optimistic read
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      try {
        await service.markAsRead(id);
      } catch {
        // Safe execution
      }
    },
    [service]
  );

  const markAllAsRead = useCallback(async () => {
    // Optimistic all read
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await service.markAllAsRead();
    } catch {
      // Safe execution
    }
  }, [service]);

  const deleteNotification = useCallback(
    async (id: string) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      try {
        await service.deleteNotification(id);
      } catch {
        // Safe execution
      }
    },
    [service]
  );

  // Group real notifications into Today, Yesterday, Earlier
  const groupedNotifications = useMemo<GroupedNotifications[]>(() => {
    if (notifications.length === 0) return [];

    const todayItems: AppNotification[] = [];
    const yesterdayItems: AppNotification[] = [];
    const earlierItems: AppNotification[] = [];

    const now = new Date();
    const todayDate = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toDateString();

    notifications.forEach((item) => {
      try {
        const itemDate = new Date(item.createdAt).toDateString();
        if (itemDate === todayDate) {
          todayItems.push(item);
        } else if (itemDate === yesterdayDate) {
          yesterdayItems.push(item);
        } else {
          earlierItems.push(item);
        }
      } catch {
        earlierItems.push(item);
      }
    });

    const groups: GroupedNotifications[] = [];
    if (todayItems.length > 0) groups.push({ group: 'Today', items: todayItems });
    if (yesterdayItems.length > 0) groups.push({ group: 'Yesterday', items: yesterdayItems });
    if (earlierItems.length > 0) groups.push({ group: 'Earlier', items: earlierItems });

    return groups;
  }, [notifications]);

  return {
    notifications,
    groupedNotifications,
    unreadCount,
    category,
    isLoading,
    isRefreshing,
    hasMore,
    errorMessage,
    setCategory,
    refresh,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
