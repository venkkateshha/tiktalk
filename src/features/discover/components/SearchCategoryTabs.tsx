import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { SearchCategory } from '../types';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface SearchCategoryTabsProps {
  activeCategory: SearchCategory;
  onSelectCategory: (category: SearchCategory) => void;
}

interface CategoryOption {
  id: SearchCategory;
  label: string;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'all', label: 'All' },
  { id: 'people', label: 'People' },
  { id: 'videos', label: 'Videos' },
  { id: 'hashtags', label: 'Hashtags' },
  { id: 'audio', label: 'Audio' },
];

export const SearchCategoryTabs: React.FC<SearchCategoryTabsProps> = ({
  activeCategory,
  onSelectCategory,
}) => {
  const { theme, typography } = useTheme();

  return (
    <View
      style={[styles.wrapper, { borderBottomColor: theme.border }]}
      accessible={true}
      accessibilityRole="tablist"
      accessibilityLabel="Search categories"
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => onSelectCategory(cat.id)}
              style={[styles.tabButton, A11yStandards.minTouchTarget]}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="tab"
              accessibilityLabel={`${cat.label} category`}
              accessibilityState={{ selected: isActive }}
            >
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? theme.text : theme.textSecondary,
                    fontWeight: isActive ? '800' : '500',
                    fontSize: typography.fontSize.sm,
                  },
                ]}
              >
                {cat.label}
              </Text>
              {isActive && (
                <View
                  style={[
                    styles.activeIndicator,
                    {
                      backgroundColor:
                        cat.id === 'all' ? BrandColors.cyan : BrandColors.pink,
                    },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 0.5,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabLabel: {
    letterSpacing: 0.2,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    height: 3,
    borderRadius: 2,
  },
});
