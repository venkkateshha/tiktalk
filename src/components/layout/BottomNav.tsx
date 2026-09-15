import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../theme';
import { BrandColors } from '../../theme/colors';
import { NavigationTab } from '../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { A11yStandards } from '../../core/a11y/a11yStandards';
import { useUnreadBadge } from '../../features/inbox/hooks/useUnreadBadge';

export interface BottomNavProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { theme, typography } = useTheme();
  const { hasUnread, badgeText } = useUnreadBadge();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.navBackground,
          borderTopColor: theme.navBorder,
        },
      ]}
      accessible={true}
      accessibilityRole="tablist"
      accessibilityLabel="Bottom navigation bar"
    >
      {/* 1. Home */}
      <TouchableOpacity
        style={[styles.tab, A11yStandards.minTouchTarget]}
        onPress={() => onTabChange('Home')}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="tab"
        accessibilityLabel="Home, tab 1 of 5"
        accessibilityState={{ selected: activeTab === 'Home' }}
      >
        <Ionicons
          name={activeTab === 'Home' ? 'home' : 'home-outline'}
          size={22}
          color={activeTab === 'Home' ? theme.text : theme.textSecondary}
        />
        <Text
          style={[
            styles.tabLabel,
            {
              color: activeTab === 'Home' ? theme.text : theme.textSecondary,
              fontSize: typography.fontSize.xs,
              fontWeight: activeTab === 'Home' ? '700' : '500',
            },
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* 2. Discover */}
      <TouchableOpacity
        style={[styles.tab, A11yStandards.minTouchTarget]}
        onPress={() => onTabChange('Discover')}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="tab"
        accessibilityLabel="Discover, tab 2 of 5"
        accessibilityState={{ selected: activeTab === 'Discover' }}
      >
        <Ionicons
          name={activeTab === 'Discover' ? 'compass' : 'compass-outline'}
          size={22}
          color={activeTab === 'Discover' ? theme.text : theme.textSecondary}
        />
        <Text
          style={[
            styles.tabLabel,
            {
              color: activeTab === 'Discover' ? theme.text : theme.textSecondary,
              fontSize: typography.fontSize.xs,
              fontWeight: activeTab === 'Discover' ? '700' : '500',
            },
          ]}
        >
          Discover
        </Text>
      </TouchableOpacity>

      {/* 3. Create ("+" Center Button) */}
      <TouchableOpacity
        style={[styles.createButtonContainer, A11yStandards.minTouchTarget]}
        onPress={() => onTabChange('Create')}
        activeOpacity={0.8}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Create video, tab 3 of 5"
      >
        <View style={styles.createButtonBorderCyan} />
        <View style={styles.createButtonBorderPink} />
        <View style={[styles.createButtonInner, { backgroundColor: theme.text }]}>
          <Ionicons name="add" size={24} color={theme.background} />
        </View>
      </TouchableOpacity>

      {/* 4. Inbox */}
      <TouchableOpacity
        style={[styles.tab, A11yStandards.minTouchTarget]}
        onPress={() => onTabChange('Inbox')}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="tab"
        accessibilityLabel={`Inbox${hasUnread ? `, ${badgeText} unread notifications` : ''}, tab 4 of 5`}
        accessibilityState={{ selected: activeTab === 'Inbox' }}
      >
        <View style={styles.iconWithBadge}>
          <Ionicons
            name={activeTab === 'Inbox' ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
            size={22}
            color={activeTab === 'Inbox' ? theme.text : theme.textSecondary}
          />
          {hasUnread && (
            <View
              style={[
                styles.tabBadge,
                { backgroundColor: BrandColors.pink },
              ]}
            >
              <Text style={styles.tabBadgeText}>{badgeText}</Text>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.tabLabel,
            {
              color: activeTab === 'Inbox' ? theme.text : theme.textSecondary,
              fontSize: typography.fontSize.xs,
              fontWeight: activeTab === 'Inbox' ? '700' : '500',
            },
          ]}
        >
          Inbox
        </Text>
      </TouchableOpacity>

      {/* 5. Profile */}
      <TouchableOpacity
        style={[styles.tab, A11yStandards.minTouchTarget]}
        onPress={() => onTabChange('Profile')}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="tab"
        accessibilityLabel="Profile, tab 5 of 5"
        accessibilityState={{ selected: activeTab === 'Profile' }}
      >
        <Ionicons
          name={activeTab === 'Profile' ? 'person' : 'person-outline'}
          size={22}
          color={activeTab === 'Profile' ? theme.text : theme.textSecondary}
        />
        <Text
          style={[
            styles.tabLabel,
            {
              color: activeTab === 'Profile' ? theme.text : theme.textSecondary,
              fontSize: typography.fontSize.xs,
              fontWeight: activeTab === 'Profile' ? '700' : '500',
            },
          ]}
        >
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: Platform.OS === 'ios' ? 82 : 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 0.5,
    paddingBottom: Platform.OS === 'ios' ? 20 : 6,
    paddingTop: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    marginTop: 3,
    letterSpacing: 0.1,
  },
  createButtonContainer: {
    width: 48,
    height: 36,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  createButtonBorderCyan: {
    position: 'absolute',
    left: 2,
    width: 40,
    height: 30,
    backgroundColor: BrandColors.cyan,
    borderRadius: 8,
  },
  createButtonBorderPink: {
    position: 'absolute',
    right: 2,
    width: 40,
    height: 30,
    backgroundColor: BrandColors.pink,
    borderRadius: 8,
  },
  createButtonInner: {
    width: 38,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  iconWithBadge: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    color: BrandColors.white,
    fontSize: 9,
    fontWeight: '800',
  },
});
