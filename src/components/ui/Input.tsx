import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme';
import { A11yStandards } from '../../core/a11y/a11yStandards';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  errorMessage,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  placeholder,
  value,
  onChangeText,
  editable = true,
  ...restProps
}) => {
  const { theme, typography, spacing, borderRadius, brandColors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const hasError = Boolean(errorMessage);

  const getBorderColor = () => {
    if (hasError) return brandColors.pink;
    if (isFocused) return brandColors.cyan;
    return theme.border;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: hasError ? brandColors.pink : theme.text,
              fontSize: typography.fontSize.sm,
              marginBottom: spacing.xs,
            },
          ]}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.surface,
            borderColor: getBorderColor(),
            borderRadius: borderRadius.sm,
            minHeight: A11yStandards.minTouchTarget.minHeight,
            paddingHorizontal: spacing.md,
          },
          isFocused && Platform.OS === 'web'
            ? ({
                outlineColor: brandColors.cyan,
                outlineWidth: 1,
                outlineStyle: 'solid',
              } as ViewStyle)
            : null,
        ]}
      >
        {leftIcon && <View style={[styles.iconSlot, { marginRight: spacing.sm }]}>{leftIcon}</View>}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel={label || placeholder || 'Text Input'}
          accessibilityHint={helperText}
          accessibilityState={{ disabled: !editable }}
          style={[
            styles.textInput,
            {
              color: theme.text,
              fontSize: typography.fontSize.base,
            },
            inputStyle,
          ]}
          {...restProps}
        />

        {rightIcon && <View style={[styles.iconSlot, { marginLeft: spacing.sm }]}>{rightIcon}</View>}
      </View>

      {(errorMessage || helperText) && (
        <Text
          style={[
            styles.message,
            {
              color: hasError ? brandColors.pink : theme.textSecondary,
              fontSize: typography.fontSize.xs,
              marginTop: spacing.xxs,
            },
          ]}
        >
          {errorMessage || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 12,
  },
  label: {
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  textInput: {
    flex: 1,
    height: '100%',
    paddingVertical: 8,
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontWeight: '400',
  },
});
