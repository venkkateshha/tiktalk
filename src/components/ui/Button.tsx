import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme';
import { BrandColors } from '../../theme/colors';
import { A11yStandards } from '../../core/a11y/a11yStandards';

export interface ButtonProps {
  label?: string;
  title?: string;
  children?: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { theme, typography, spacing, borderRadius } = useTheme();
  const textContent = label || title || (typeof children === 'string' ? children : '');

  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.sm,
      minHeight: A11yStandards.minTouchTarget.minHeight, // 44px min touch target
      minWidth: A11yStandards.minTouchTarget.minWidth,
      alignSelf: fullWidth ? 'stretch' : 'auto',
    };

    switch (size) {
      case 'sm':
        base.paddingVertical = spacing.xs;
        base.paddingHorizontal = spacing.md;
        base.minHeight = 36;
        break;
      case 'lg':
        base.paddingVertical = spacing.base;
        base.paddingHorizontal = spacing.xl;
        base.minHeight = 52;
        break;
      case 'md':
      default:
        base.paddingVertical = spacing.sm;
        base.paddingHorizontal = spacing.lg;
        break;
    }

    switch (variant) {
      case 'primary':
        base.backgroundColor = BrandColors.cyan;
        break;
      case 'accent':
        base.backgroundColor = BrandColors.pink;
        break;
      case 'secondary':
        base.backgroundColor = theme.surface;
        base.borderWidth = 1;
        base.borderColor = theme.border;
        break;
      case 'outline':
        base.backgroundColor = 'transparent';
        base.borderWidth = 1.5;
        base.borderColor = theme.border;
        break;
      case 'ghost':
        base.backgroundColor = 'transparent';
        break;
    }

    if (disabled) {
      base.opacity = 0.45;
    }

    return base;
  };

  const getLabelStyle = (): TextStyle => {
    let color: string;
    switch (variant) {
      case 'primary':
        color = BrandColors.black;
        break;
      case 'accent':
        color = BrandColors.white;
        break;
      case 'secondary':
      case 'outline':
      case 'ghost':
      default:
        color = theme.text;
        break;
    }

    return {
      color,
      fontSize: size === 'sm' ? typography.fontSize.sm : typography.fontSize.base,
      fontWeight: '700',
    };
  };

  return (
    <TouchableOpacity
      style={[getContainerStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || textContent || 'Button'}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? BrandColors.black : BrandColors.white}
        />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          {textContent ? (
            <Text
              style={[
                getLabelStyle(),
                icon ? { marginLeft: spacing.xs } : null,
                textStyle,
              ]}
            >
              {textContent}
            </Text>
          ) : (
            children
          )}
        </>
      )}
    </TouchableOpacity>
  );
};
