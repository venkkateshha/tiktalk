import { useState, useEffect } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);

      const handler = (event: MediaQueryListEvent) => {
        setReducedMotion(event.matches);
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
      }
    } else {
      AccessibilityInfo.isReduceMotionEnabled()
        .then(setReducedMotion)
        .catch(() => setReducedMotion(false));

      const subscription = AccessibilityInfo.addEventListener(
        'reduceMotionChanged',
        (isEnabled) => {
          setReducedMotion(isEnabled);
        }
      );

      return () => {
        if (subscription && typeof subscription.remove === 'function') {
          subscription.remove();
        }
      };
    }
  }, []);

  return reducedMotion;
}
