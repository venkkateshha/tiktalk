import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { A11yStandards } from '../../core/a11y/a11yStandards';

export interface IconButtonProps {
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'surface' | 'primary' | 'accent';
  color?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export const IconButton: React.FC<IconButtonProps> = ({
  iconName,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  size = 'md',
  variant = 'ghost',
  color,
  disabled = false,
  style,
}) => {
  const { theme, brandColors } = useTheme();

  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return { containerSize: 44, iconSize: 20 };
      case 'lg':
        return { containerSize: 52, iconSize: 28 };
      case 'md':
      default:
        return { containerSize: 44, iconSize: 24 };
    }
  };

  const { containerSize, iconSize } = getDimensions();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'surface':
        return theme.surface;
      case 'primary':
        return brandColors.cyan;
      case 'accent':
        return brandColors.pink;
      case 'ghost':
      default:
        return 'transparent';
    }
  };

  const getIconColor = () => {
    if (color) return color;
    switch (variant) {
      case 'primary':
        return brandColors.black;
      case 'accent':
        return brandColors.white;
      case 'surface':
      case 'ghost':
      default:
        return theme.text;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={[
        styles.base,
        {
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
          backgroundColor: getBackgroundColor(),
          borderWidth: variant === 'surface' ? 1 : 0,
          borderColor: theme.border,
          opacity: disabled ? 0.4 : 1,
        },
        A11yStandards.minTouchTarget,
        style,
      ]}
    >
      <Ionicons name={iconName} size={iconSize} color={getIconColor()} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
