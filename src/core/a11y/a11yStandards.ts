/**
 * TikTalk Accessibility (a11y) Foundation
 * Standards for WCAG AA compliance, touch targets, and contrast
 */

import { ViewStyle, AccessibilityRole } from 'react-native';

export const A11yStandards = {
  // Apple HIG & Android Material min interactive touch target (44x44 pt / 48x48 dp)
  minTouchTarget: {
    minWidth: 44,
    minHeight: 44,
  } as ViewStyle,

  // WCAG AA contrast ratio minimums
  contrastRatio: {
    normalText: 4.5,
    largeText: 3.0,
    uiComponents: 3.0,
  },

  // Focus ring style for keyboard navigation on Web
  focusRing: {
    outlineWidth: 2,
    outlineStyle: 'solid',
    outlineColor: '#25F4EE', // TikTalk Cyan focus ring
    outlineOffset: 2,
  },
} as const;

export interface AccessibleElementProps {
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessible?: boolean;
}

export function createAccessibleProps(
  label: string,
  role: AccessibilityRole = 'button',
  hint?: string
): AccessibleElementProps {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityRole: role,
    accessibilityHint: hint,
  };
}
