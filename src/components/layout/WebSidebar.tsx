import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { BrandColors } from '../../theme/colors';
import { NavigationTab } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { A11yStandards } from '../../core/a11y/a11yStandards';
import { useUnreadBadge } from '../../features/inbox/hooks/useUnreadBadge';

interface WebSidebarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export const WebSidebar: React.FC<WebSidebarProps> = ({ activeTab, onTabChange }) => {
  const { theme, typography } = useTheme();
  const { hasUnread, badgeText } = useUnreadBadge();

  const navItems: { tab: NavigationTab; label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }[] = [
    { tab: 'Home', label: 'For You', icon: 'home-outline', iconActive: 'home' },
    { tab: 'Discover', label: 'Explore', icon: 'compass-outline', iconActive: 'compass' },
    { tab: 'Create', label: 'Upload Studio', icon: 'add-circle-outline', iconActive: 'add-circle' },
    { tab: 'Inbox', label: 'Messages', icon: 'chatbubble-ellipses-outline', iconActive: 'chatbubble-ellipses' },
    { tab: 'Profile', label: 'Creator Profile', icon: 'person-outline', iconActive: 'person' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderRightColor: theme.border }]}>
      {/* Brand Header */}
      <View style={styles.brandHeader}>
        <Text style={[styles.brandTitle, { color: theme.text }]}>
          Tik<Text style={{ color: BrandColors.cyan }}>Talk</Text>
        </Text>
        <Text style={[styles.brandSubtitle, { color: theme.textSecondary }]}>
          Creator Platform
        </Text>
      </View>

      {/* Nav List */}
      <View style={styles.navList}>
        {navItems.map((item) => {
          const isActive = activeTab === item.tab;
          const isInbox = item.tab === 'Inbox';
          return (
            <TouchableOpacity
              key={item.tab}
              style={[
                styles.navItem,
                A11yStandards.minTouchTarget,
                isActive && {
                  backgroundColor: theme.card,
                  borderLeftWidth: 3,
                  borderLeftColor: item.tab === 'Home' ? BrandColors.cyan : BrandColors.pink,
                },
              ]}
              onPress={() => onTabChange(item.tab)}
              activeOpacity={0.8}
              accessible={true}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${item.label}${isInbox && hasUnread ? `, ${badgeText} unread` : ''}`}
            >
              <Ionicons
                name={isActive ? item.iconActive : item.icon}
                size={22}
                color={isActive ? theme.text : theme.textSecondary}
              />
              <Text
                style={[
                  styles.navLabel,
                  {
                    color: isActive ? theme.text : theme.textSecondary,
                    fontWeight: isActive ? '700' : '500',
                    fontSize: typography.fontSize.base,
                  },
                ]}
              >
                {item.label}
              </Text>
              {isInbox && hasUnread && (
                <View style={styles.sidebarBadge}>
                  <Text style={styles.sidebarBadgeText}>{badgeText}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Creator Economy Callout */}
      <View style={[styles.creatorCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.creatorBadge}>
          <Text style={styles.creatorBadgeText}>60% REV-SHARE</Text>
        </View>
        <Text style={[styles.creatorCardTitle, { color: theme.text }]}>
          Weekly Monday UPI Payouts
        </Text>
        <Text style={[styles.creatorCardDesc, { color: theme.textSecondary }]}>
          Earn directly from your views with transparent double-entry accounting.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 240,
    borderRightWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
    justifyContent: 'space-between',
    height: '100%',
  },
  brandHeader: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  navList: {
    flex: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  navLabel: {
    marginLeft: 14,
    letterSpacing: 0.2,
  },
  creatorCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 16,
  },
  creatorBadge: {
    backgroundColor: BrandColors.pink,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  creatorBadgeText: {
    color: BrandColors.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  creatorCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  creatorCardDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  sidebarBadge: {
    backgroundColor: BrandColors.pink,
    marginLeft: 'auto',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarBadgeText: {
    color: BrandColors.white,
    fontSize: 10,
    fontWeight: '800',
  },
});
