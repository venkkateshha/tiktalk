import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme';
import { BrandColors } from '../../theme/colors';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const { theme, typography } = useTheme();

  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
    };

    switch (size) {
      case 'sm':
        base.paddingVertical = 6;
        base.paddingHorizontal = 12;
        break;
      case 'lg':
        base.paddingVertical = 14;
        base.paddingHorizontal = 24;
        break;
      case 'md':
      default:
        base.paddingVertical = 10;
        base.paddingHorizontal = 18;
        break;
    }

    switch (variant) {
      case 'primary':
        base.backgroundColor = BrandColors.cyan;
        break;
      case 'accent':
        base.backgroundColor = BrandColors.pink;
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
      base.opacity = 0.5;
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
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? BrandColors.black : BrandColors.white}
        />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text style={[getLabelStyle(), icon ? { marginLeft: 8 } : null, textStyle]}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};
