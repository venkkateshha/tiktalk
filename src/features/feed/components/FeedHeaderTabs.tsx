import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { FeedFilter } from '../types';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface FeedHeaderTabsProps {
  activeFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
}

export const FeedHeaderTabs: React.FC<FeedHeaderTabsProps> = ({
  activeFilter,
  onFilterChange,
}) => {
  const { theme, typography } = useTheme();

  return (
    <View
      style={styles.tabsWrapper}
      accessible={true}
      accessibilityRole="tablist"
      accessibilityLabel="Feed selector"
    >
      {/* 1. Following Tab */}
      <TouchableOpacity
        onPress={() => onFilterChange('following')}
        style={[styles.tabButton, A11yStandards.minTouchTarget]}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="tab"
        accessibilityLabel="Following feed"
        accessibilityState={{ selected: activeFilter === 'following' }}
      >
        <Text
          style={[
            styles.tabText,
            {
              color: activeFilter === 'following' ? theme.text : theme.textSecondary,
              fontWeight: activeFilter === 'following' ? '800' : '500',
              fontSize: typography.fontSize.base,
            },
          ]}
        >
          Following
        </Text>
        {activeFilter === 'following' && (
          <View style={[styles.activeIndicator, { backgroundColor: BrandColors.cyan }]} />
        )}
      </TouchableOpacity>

      <View style={styles.tabDivider} />

      {/* 2. For You Tab */}
      <TouchableOpacity
        onPress={() => onFilterChange('forYou')}
        style={[styles.tabButton, A11yStandards.minTouchTarget]}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="tab"
        accessibilityLabel="For You feed"
        accessibilityState={{ selected: activeFilter === 'forYou' }}
      >
        <Text
          style={[
            styles.tabText,
            {
              color: activeFilter === 'forYou' ? theme.text : theme.textSecondary,
              fontWeight: activeFilter === 'forYou' ? '800' : '500',
              fontSize: typography.fontSize.base,
            },
          ]}
        >
          For You
        </Text>
        {activeFilter === 'forYou' && (
          <View style={[styles.activeIndicator, { backgroundColor: BrandColors.pink }]} />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButton: {
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabText: {
    letterSpacing: 0.2,
  },
  tabDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 22,
    height: 3,
    borderRadius: 2,
  },
});
