import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { BrandColors } from '../../theme/colors';
import { FeedType } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { FeedHeaderTabs } from '../../features/feed/components/FeedHeaderTabs';

interface HeaderProps {
  activeFeed: FeedType;
  onFeedChange: (feed: FeedType) => void;
  showTabs?: boolean;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeFeed,
  onFeedChange,
  showTabs = true,
  title,
}) => {
  const { theme, isDark, toggleTheme, typography } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
      {/* Brand / Logo */}
      <View style={styles.brandContainer}>
        <Text style={[styles.brandText, { color: theme.text }]}>
          Tik<Text style={{ color: BrandColors.cyan }}>Talk</Text>
        </Text>
      </View>

      {/* Center Feed Tabs (Following | For You) */}
      {showTabs ? (
        <FeedHeaderTabs
          activeFilter={activeFeed as any}
          onFilterChange={onFeedChange as any}
        />
      ) : (
        <View style={styles.titleContainer}>
          <Text style={[styles.screenTitle, { color: theme.text, fontSize: typography.fontSize.md }]}>
            {title}
          </Text>
        </View>
      )}

      {/* Theme Toggle (Dark Mode / Light Mode - NO third theme) */}
      <TouchableOpacity
        onPress={toggleTheme}
        style={[styles.themeToggle, { backgroundColor: theme.surface, borderColor: theme.border }]}
        accessibilityLabel={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isDark ? 'sunny-outline' : 'moon-outline'}
          size={18}
          color={isDark ? BrandColors.cyan : BrandColors.black}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    zIndex: 10,
  },
  brandContainer: {
    minWidth: 80,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'relative',
    alignItems: 'center',
  },
  tabText: {
    letterSpacing: 0.2,
  },
  tabDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(128,128,128,0.3)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 20,
    height: 3,
    borderRadius: 2,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  screenTitle: {
    fontWeight: '700',
  },
  themeToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
