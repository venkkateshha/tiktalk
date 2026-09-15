import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { BrandColors } from '../../theme/colors';
import { Header } from '../../components/ui/Header';
import { EmptyState } from '../../components/ui/EmptyState';
import { A11yStandards } from '../../core/a11y/a11yStandards';
import { useNavigation } from '../../navigation';
import { AppNotification } from '../../domain/notification';
import { useNotifications } from './hooks/useNotifications';
import { NotificationRow } from './components/NotificationRow';
import { NotificationCategoryBar } from './components/NotificationCategoryBar';
import { NotificationPreferencesModal } from './components/NotificationPreferencesModal';

export const InboxScreen: React.FC = () => {
  const { theme, typography } = useTheme();
  const { setActiveTab, openStories } = useNavigation();

  const [isPreferencesVisible, setIsPreferencesVisible] = useState<boolean>(false);

  const {
    notifications,
    groupedNotifications,
    unreadCount,
    category,
    isLoading,
    isRefreshing,
    hasMore,
    errorMessage,
    setCategory,
    refresh,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const handleNotificationPress = (notification: AppNotification) => {
    markAsRead(notification.id);

    // Deep link routing based on valid target contract
    const targetType = notification.targetType || notification.target?.type;
    const targetId = notification.targetId || notification.target?.id;

    if (!targetType) return;

    if (targetType === 'story') {
      const storyUser = notification.sender?.username || notification.senderId;
      if (storyUser) {
        openStories({
          userId: storyUser,
          entryPoint: 'home_rail',
        });
      }
    } else if (targetType === 'profile') {
      if (targetId || notification.senderId) {
        setActiveTab('Profile');
      }
    } else if (targetType === 'post' || targetType === 'comment') {
      if (targetId) {
        setActiveTab('Home');
      }
    } else if (targetType === 'live') {
      setActiveTab('Home');
    } else if (targetType === 'wallet' || targetType === 'earnings') {
      setActiveTab('Profile');
    } else if (targetType === 'message' || targetType === 'chat') {
      setActiveTab('Inbox');
    }
  };

  const handleFollowBack = (userId: string) => {
    if (userId) {
      setActiveTab('Profile');
    }
  };

  const getEmptyStateDescription = (): { title: string; desc: string } => {
    switch (category) {
      case 'likes':
        return {
          title: 'No Likes Yet',
          desc: 'When users like your videos or comments, you will see them here.',
        };
      case 'comments':
        return {
          title: 'No Comments Yet',
          desc: 'Replies and comments from your audience will appear here.',
        };
      case 'mentions':
        return {
          title: 'No Mentions Yet',
          desc: 'When other creators mention or tag you, updates will be listed here.',
        };
      case 'followers':
        return {
          title: 'No New Followers Yet',
          desc: 'New followers joining your community will appear here.',
        };
      case 'stories':
        return {
          title: 'No Story Activity Yet',
          desc: 'Views, replies, and reactions to your 24-hour stories will appear here.',
        };
      case 'live':
        return {
          title: 'No Live Alerts',
          desc: 'Notifications when your favorite creators go LIVE will show up here.',
        };
      case 'earnings':
        return {
          title: 'No Earnings Alerts',
          desc: 'Weekly Monday UPI payout statements and creator revenue will be listed here.',
        };
      case 'security':
        return {
          title: 'All Secure',
          desc: 'No security warnings or unauthorized login attempts detected.',
        };
      case 'system':
        return {
          title: 'No System Announcements',
          desc: 'Official platform news and community guidelines updates will appear here.',
        };
      case 'all':
      default:
        return {
          title: 'No Notifications Yet',
          desc: 'When users interact with your content or send updates, you will see them here in real-time.',
        };
    }
  };

  const emptyInfo = getEmptyStateDescription();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 1. Global Header with Dark/Light switcher */}
      <Header
        activeFeed="forYou"
        onFeedChange={() => {}}
        showTabs={false}
        title="Activity"
      />

      {/* 2. Inbox Action Subheader: Title, Unread Pill, Mark All Read, Settings */}
      <View
        style={[
          styles.actionHeader,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={styles.actionHeaderLeft}>
          <Text
            style={[
              styles.actionHeaderTitle,
              { color: theme.text, fontSize: typography.fontSize.md },
            ]}
          >
            All Activity
          </Text>
          {unreadCount > 0 && (
            <View
              style={[
                styles.unreadPill,
                { backgroundColor: BrandColors.pink },
              ]}
            >
              <Text style={styles.unreadPillText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionHeaderRight}>
          {/* Mark all as read button */}
          <TouchableOpacity
            style={[styles.headerActionBtn, A11yStandards.minTouchTarget]}
            onPress={markAllAsRead}
            disabled={unreadCount === 0}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Mark all notifications as read"
          >
            <Ionicons
              name="checkmark-done"
              size={20}
              color={unreadCount > 0 ? BrandColors.cyan : theme.textSecondary}
            />
          </TouchableOpacity>

          {/* Settings button */}
          <TouchableOpacity
            style={[styles.headerActionBtn, A11yStandards.minTouchTarget]}
            onPress={() => setIsPreferencesVisible(true)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Notification settings"
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={theme.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Category Filter Chips */}
      <NotificationCategoryBar
        activeCategory={category}
        onSelectCategory={setCategory}
      />

      {/* 4. Activity List / Grouped Sections / Empty State */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={BrandColors.cyan}
            colors={[BrandColors.cyan]}
          />
        }
      >
        {isLoading && notifications.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={BrandColors.cyan} />
          </View>
        ) : notifications.length === 0 ? (
          <EmptyState
            title={emptyInfo.title}
            badgeText="Activity Stream Ready"
            description={emptyInfo.desc}
            iconName="notifications-outline"
          />
        ) : (
          <View style={styles.listWrapper}>
            {groupedNotifications.map((groupSection) => (
              <View key={groupSection.group} style={styles.groupSection}>
                <Text
                  style={[
                    styles.groupHeaderTitle,
                    {
                      color: theme.textSecondary,
                      fontSize: typography.fontSize.xs,
                    },
                  ]}
                >
                  {groupSection.group.toUpperCase()}
                </Text>

                <View
                  style={[
                    styles.groupCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  {groupSection.items.map((item, idx) => (
                    <View key={item.id}>
                      <NotificationRow
                        notification={item}
                        onPress={handleNotificationPress}
                        onDelete={deleteNotification}
                        onFollowBack={handleFollowBack}
                      />
                      {idx < groupSection.items.length - 1 && (
                        <View
                          style={[
                            styles.itemDivider,
                            { backgroundColor: theme.border },
                          ]}
                        />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {hasMore && (
              <TouchableOpacity
                style={[
                  styles.loadMoreBtn,
                  A11yStandards.minTouchTarget,
                  { borderColor: theme.border },
                ]}
                onPress={loadMore}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Load more activity"
              >
                <Text style={{ color: BrandColors.cyan, fontWeight: '600' }}>
                  Load More Activity
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Security & Tenant Isolation Notice */}
        <View
          style={[
            styles.securityCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons name="shield-checkmark-outline" size={18} color={BrandColors.cyan} />
          <Text
            style={[
              styles.securityText,
              { color: theme.textSecondary, fontSize: typography.fontSize.xs },
            ]}
          >
            TikTalk End-to-End notification architecture is designed with strict tenant isolation, zero tracking leakage, and Vanish Mode privacy.
          </Text>
        </View>
      </ScrollView>

      {/* 5. Notification Preferences Modal */}
      {isPreferencesVisible && (
        <NotificationPreferencesModal
          visible={isPreferencesVisible}
          onClose={() => setIsPreferencesVisible(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionHeaderTitle: {
    fontWeight: '700',
  },
  unreadPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadPillText: {
    color: BrandColors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  actionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listWrapper: {
    gap: 16,
  },
  groupSection: {
    marginBottom: 8,
  },
  groupHeaderTitle: {
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 68,
  },
  loadMoreBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 12,
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 24,
    maxWidth: 500,
    alignSelf: 'center',
  },
  securityText: {
    marginLeft: 10,
    flex: 1,
    lineHeight: 16,
  },
});
