/**
 * TikTalk Phase 8: NotificationCategoryBar Component
 * Horizontal scrollable activity filter chips.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  NotificationCategory,
  NOTIFICATION_CATEGORIES,
} from '../../../domain/notification';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface NotificationCategoryBarProps {
  activeCategory: NotificationCategory;
  onSelectCategory: (category: NotificationCategory) => void;
}

export const NotificationCategoryBar: React.FC<NotificationCategoryBarProps> = ({
  activeCategory,
  onSelectCategory,
}) => {
  const { theme, typography } = useTheme();

  return (
    <View
      style={[styles.container, { borderBottomColor: theme.border }]}
      accessible={true}
      accessibilityRole="tablist"
      accessibilityLabel="Activity categories"
    >
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {NOTIFICATION_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.chip,
                A11yStandards.minTouchTarget,
                {
                  backgroundColor: isActive ? BrandColors.cyan : theme.surface,
                  borderColor: isActive ? BrandColors.cyan : theme.border,
                },
              ]}
              onPress={() => onSelectCategory(cat.key)}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${cat.label} filter`}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isActive ? BrandColors.black : theme.text,
                    fontSize: typography.fontSize.xs,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {},
});
