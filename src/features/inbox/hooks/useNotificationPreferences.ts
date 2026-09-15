/**
 * TikTalk Phase 8: useNotificationPreferences Hook
 * Manages user notification settings, category toggles, and persistence.
 * Invariant: Security alerts cannot be disabled.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '../../../domain/notification';
import {
  notificationsService,
  NotificationCoordinator,
} from '../../../services/notifications';

export interface UseNotificationPreferencesReturn {
  preferences: NotificationPreferences;
  isLoading: boolean;
  togglePreference: (key: keyof NotificationPreferences) => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
}

export function useNotificationPreferences(): UseNotificationPreferencesReturn {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    notificationsService
      .getPreferences()
      .then((prefs) => {
        if (isMounted) {
          setPreferences(prefs);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    const unsubscribe = NotificationCoordinator.subscribe((event) => {
      if (event.type === 'preferences_updated' && event.preferences) {
        setPreferences(event.preferences);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const togglePreference = useCallback(
    async (key: keyof NotificationPreferences) => {
      if (key === 'security') {
        // Security alerts cannot be disabled
        return;
      }

      const nextVal = !preferences[key];
      const updated = {
        ...preferences,
        [key]: nextVal,
        security: true,
      };

      setPreferences(updated);
      try {
        await notificationsService.updatePreferences(updated);
      } catch {
        // Revert on failure
        setPreferences(preferences);
      }
    },
    [preferences]
  );

  const updatePreferences = useCallback(
    async (partial: Partial<NotificationPreferences>) => {
      const updated = {
        ...preferences,
        ...partial,
        security: true,
      };
      setPreferences(updated);
      try {
        await notificationsService.updatePreferences(updated);
      } catch {
        setPreferences(preferences);
      }
    },
    [preferences]
  );

  return {
    preferences,
    isLoading,
    togglePreference,
    updatePreferences,
  };
}
