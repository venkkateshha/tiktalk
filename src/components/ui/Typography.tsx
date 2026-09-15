import React from 'react';
import { Text, TextStyle, StyleSheet, AccessibilityRole } from 'react-native';
import { useTheme } from '../../theme';

export type TypographyVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'title'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'overline';

export type TypographyColor =
  | 'default'
  | 'secondary'
  | 'muted'
  | 'primary'
  | 'accent'
  | 'inverse';

export interface TypographyProps {
  variant?: TypographyVariant;
  color?: TypographyColor;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy';
  align?: 'left' | 'center' | 'right';
  numberOfLines?: number;
  style?: TextStyle;
  children: React.ReactNode;
  accessibilityRole?: AccessibilityRole;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color = 'default',
  weight,
  align = 'left',
  numberOfLines,
  style,
  children,
  accessibilityRole,
}) => {
  const { theme, typography, brandColors } = useTheme();

  const getVariantStyle = (): TextStyle => {
    switch (variant) {
      case 'display':
        return {
          fontSize: typography.fontSize.display,
          lineHeight: typography.lineHeight.display,
          fontWeight: typography.fontWeight.heavy,
          letterSpacing: -1,
        };
      case 'h1':
        return {
          fontSize: typography.fontSize.xxl,
          lineHeight: typography.lineHeight.xxl,
          fontWeight: typography.fontWeight.bold,
          letterSpacing: -0.5,
        };
      case 'h2':
        return {
          fontSize: typography.fontSize.xl,
          lineHeight: typography.lineHeight.xl,
          fontWeight: typography.fontWeight.bold,
        };
      case 'h3':
        return {
          fontSize: typography.fontSize.lg,
          lineHeight: typography.lineHeight.lg,
          fontWeight: typography.fontWeight.semibold,
        };
      case 'title':
        return {
          fontSize: typography.fontSize.md,
          lineHeight: typography.lineHeight.md,
          fontWeight: typography.fontWeight.semibold,
        };
      case 'bodySmall':
        return {
          fontSize: typography.fontSize.sm,
          lineHeight: typography.lineHeight.sm,
          fontWeight: typography.fontWeight.regular,
        };
      case 'caption':
        return {
          fontSize: typography.fontSize.xs,
          lineHeight: typography.lineHeight.xs,
          fontWeight: typography.fontWeight.regular,
        };
      case 'overline':
        return {
          fontSize: typography.fontSize.xs,
          lineHeight: typography.lineHeight.xs,
          fontWeight: typography.fontWeight.bold,
          letterSpacing: 1,
          textTransform: 'uppercase',
        };
      case 'body':
      default:
        return {
          fontSize: typography.fontSize.base,
          lineHeight: typography.lineHeight.base,
          fontWeight: typography.fontWeight.regular,
        };
    }
  };

  const getColorStyle = (): string => {
    switch (color) {
      case 'secondary':
        return theme.textSecondary;
      case 'muted':
        return theme.textMuted;
      case 'primary':
        return brandColors.cyan;
      case 'accent':
        return brandColors.pink;
      case 'inverse':
        return theme.background;
      case 'default':
      default:
        return theme.text;
    }
  };

  const getWeightStyle = (): TextStyle => {
    if (!weight) return {};
    return { fontWeight: typography.fontWeight[weight] };
  };

  const role: AccessibilityRole =
    accessibilityRole ||
    (variant === 'display' || variant === 'h1' || variant === 'h2' || variant === 'h3'
      ? 'header'
      : 'text');

  return (
    <Text
      numberOfLines={numberOfLines}
      accessibilityRole={role}
      style={[
        getVariantStyle(),
        { color: getColorStyle(), textAlign: align },
        getWeightStyle(),
        style,
      ]}
    >
      {children}
    </Text>
  );
};
