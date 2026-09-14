import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { BrandColors } from '../../theme/colors';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'accent' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'primary' }) => {
  const { theme, typography } = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return BrandColors.cyan;
      case 'accent':
        return BrandColors.pink;
      case 'neutral':
      default:
        return theme.border;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return BrandColors.black;
      case 'accent':
        return BrandColors.white;
      case 'neutral':
      default:
        return theme.text;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <Text style={[styles.label, { color: getTextColor(), fontSize: typography.fontSize.xs }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
