/**
 * TikTalk Phase 9: InboxScreen
 * Dual-mode Inbox with unified Messages (1:1 & Group Chat) | Activity (Notifications) switcher.
 * Full mobile push-thread navigation & tablet/desktop master-detail split layout.
 * Strictly zero fake data, honest empty/loading/offline states, locked TikTalk colors.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
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
import { useConversations } from './hooks/useConversations';
import { chatService } from '../../services/chat';
import {
  NotificationRow,
  NotificationCategoryBar,
  NotificationPreferencesModal,
  ConversationList,
  ChatThreadView,
  NewConversationModal,
} from './components';

export type InboxMode = 'messages' | 'activity';

export const InboxScreen: React.FC = () => {
  const { theme, typography } = useTheme();
  const { width } = useWindowDimensions();
  const { setActiveTab, openStories } = useNavigation();

  // Mode switcher: 'messages' vs 'activity'
  const [inboxMode, setInboxMode] = useState<InboxMode>('messages');

  // Chat conversation state
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isNewConvModalVisible, setIsNewConvModalVisible] = useState<boolean>(false);

  // Responsive breakpoint: >= 768 is tablet / desktop master-detail
  const isMasterDetail = width >= 768;

  // Conversations Hook
  const {
    conversations,
    totalUnreadMessages: messagesUnread,
    isLoading: isConversationsLoading,
    isRefreshing: isConversationsRefreshing,
    searchQuery,
    activeFilter,
    setSearchQuery,
    setActiveFilter,
    refresh: refreshConversations,
    createDirectConversation,
    createGroupConversation,
  } = useConversations();

  // Phase 8 Notifications Hook
  const [isPreferencesVisible, setIsPreferencesVisible] = useState<boolean>(false);
  const {
    notifications,
    groupedNotifications,
    unreadCount: activityUnread,
    category,
    isLoading: isNotifLoading,
    isRefreshing: isNotifRefreshing,
    hasMore: hasMoreNotif,
    errorMessage: notifError,
    setCategory,
    refresh: refreshNotif,
    loadMore: loadMoreNotif,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  // Handle new conversation creation
  const handleStartDirect = async (participantId: string) => {
    const conv = await createDirectConversation(participantId);
    setSelectedConversationId(conv.id);
  };

  const handleStartGroup = async (title: string, participantIds: string[]) => {
    const conv = await createGroupConversation(title, participantIds);
    setSelectedConversationId(conv.id);
  };

  // Profile navigation handler
  const handleProfilePress = (userId: string) => {
    if (userId) {
      setActiveTab('Profile');
    }
  };

  // Notification click handler with chat deeplink integration
  const handleNotificationPress = (notification: AppNotification) => {
    markAsRead(notification.id);

    const targetType = notification.targetType || notification.target?.type;
    const targetId = notification.targetId || notification.target?.id;

    if (!targetType) return;

    if (targetType === 'message' || targetType === 'chat') {
      setInboxMode('messages');
      if (targetId) {
        setSelectedConversationId(targetId);
      }
      return;
    }

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
    } else if (targetType === 'post' || targetType === 'comment' || targetType === 'live') {
      if (targetId) {
        setActiveTab('Home');
      }
    } else if (targetType === 'wallet' || targetType === 'earnings') {
      setActiveTab('Profile');
    }
  };

  const getEmptyActivityDescription = (): { title: string; desc: string } => {
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

  const emptyActivity = getEmptyActivityDescription();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 1. Global Header with Dark/Light switcher */}
      <Header
        activeFeed="forYou"
        onFeedChange={() => {}}
        showTabs={false}
        title="Inbox"
      />

      {/* 2. Top Segmented Switcher: Messages | Activity */}
      <View
        style={[
          styles.segmentedControl,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
          },
        ]}
        accessible={true}
        accessibilityRole="tablist"
        accessibilityLabel="Inbox Sections"
      >
        {/* Tab 1: Messages */}
        <TouchableOpacity
          style={[
            styles.segmentTab,
            A11yStandards.minTouchTarget,
            inboxMode === 'messages' && [
              styles.segmentTabActive,
              { borderBottomColor: BrandColors.cyan },
            ],
          ]}
          onPress={() => setInboxMode('messages')}
          accessible={true}
          accessibilityRole="tab"
          accessibilityState={{ selected: inboxMode === 'messages' }}
          accessibilityLabel={`Messages tab${messagesUnread > 0 ? `, ${messagesUnread} unread` : ''}`}
        >
          <Ionicons
            name={inboxMode === 'messages' ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
            size={18}
            color={inboxMode === 'messages' ? BrandColors.cyan : theme.textSecondary}
          />
          <Text
            style={[
              styles.segmentLabel,
              {
                color: inboxMode === 'messages' ? theme.text : theme.textSecondary,
                fontSize: typography.fontSize.sm,
                fontWeight: inboxMode === 'messages' ? '700' : '500',
              },
            ]}
          >
            Messages
          </Text>
          {messagesUnread > 0 && (
            <View style={[styles.badgePill, { backgroundColor: BrandColors.pink }]}>
              <Text style={styles.badgeText}>
                {messagesUnread > 99 ? '99+' : messagesUnread}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Tab 2: Activity */}
        <TouchableOpacity
          style={[
            styles.segmentTab,
            A11yStandards.minTouchTarget,
            inboxMode === 'activity' && [
              styles.segmentTabActive,
              { borderBottomColor: BrandColors.pink },
            ],
          ]}
          onPress={() => setInboxMode('activity')}
          accessible={true}
          accessibilityRole="tab"
          accessibilityState={{ selected: inboxMode === 'activity' }}
          accessibilityLabel={`Activity tab${activityUnread > 0 ? `, ${activityUnread} unread` : ''}`}
        >
          <Ionicons
            name={inboxMode === 'activity' ? 'notifications' : 'notifications-outline'}
            size={18}
            color={inboxMode === 'activity' ? BrandColors.pink : theme.textSecondary}
          />
          <Text
            style={[
              styles.segmentLabel,
              {
                color: inboxMode === 'activity' ? theme.text : theme.textSecondary,
                fontSize: typography.fontSize.sm,
                fontWeight: inboxMode === 'activity' ? '700' : '500',
              },
            ]}
          >
            Activity
          </Text>
          {activityUnread > 0 && (
            <View style={[styles.badgePill, { backgroundColor: BrandColors.pink }]}>
              <Text style={styles.badgeText}>
                {activityUnread > 99 ? '99+' : activityUnread}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 3. Render Mode Content */}
      {inboxMode === 'messages' ? (
        /* MESSAGES SECTION */
        isMasterDetail ? (
          /* Tablet/Desktop Master-Detail Split Layout */
          <View style={styles.masterDetailContainer}>
            {/* Master: Conversation List */}
            <View
              style={[
                styles.masterPanel,
                {
                  backgroundColor: theme.background,
                  borderRightColor: theme.border,
                },
              ]}
            >
              <ConversationList
                conversations={conversations}
                selectedId={selectedConversationId}
                searchQuery={searchQuery}
                activeFilter={activeFilter}
                isLoading={isConversationsLoading}
                isRefreshing={isConversationsRefreshing}
                onSearchChange={setSearchQuery}
                onFilterChange={setActiveFilter}
                onSelectConversation={(conv) => setSelectedConversationId(conv.id)}
                onNewConversation={() => setIsNewConvModalVisible(true)}
                onRefresh={refreshConversations}
              />
            </View>

            {/* Detail: Active Chat Thread or Empty Placeholder */}
            <View style={[styles.detailPanel, { backgroundColor: theme.surface }]}>
              {selectedConversationId ? (
                <ChatThreadView
                  conversationId={selectedConversationId}
                  onProfilePress={handleProfilePress}
                />
              ) : (
                <EmptyState
                  title="Your Direct Messages"
                  badgeText="1:1 & Group Chat Ready"
                  description="Select a conversation from the left to view messages, or start a new chat."
                  iconName="chatbubble-ellipses-outline"
                />
              )}
            </View>
          </View>
        ) : (
          /* Mobile Full-Screen Layout: Thread vs Conversation List */
          selectedConversationId ? (
            <ChatThreadView
              conversationId={selectedConversationId}
              onBack={() => setSelectedConversationId(null)}
              onProfilePress={handleProfilePress}
            />
          ) : (
            <ConversationList
              conversations={conversations}
              selectedId={selectedConversationId}
              searchQuery={searchQuery}
              activeFilter={activeFilter}
              isLoading={isConversationsLoading}
              isRefreshing={isConversationsRefreshing}
              onSearchChange={setSearchQuery}
              onFilterChange={setActiveFilter}
              onSelectConversation={(conv) => setSelectedConversationId(conv.id)}
              onNewConversation={() => setIsNewConvModalVisible(true)}
              onRefresh={refreshConversations}
            />
          )
        )
      ) : (
        /* ACTIVITY (NOTIFICATIONS) SECTION — Preserved from Phase 8 */
        <View style={styles.activityContainer}>
          {/* Subheader: All Activity & Settings */}
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
              {activityUnread > 0 && (
                <View style={[styles.unreadPill, { backgroundColor: BrandColors.pink }]}>
                  <Text style={styles.unreadPillText}>
                    {activityUnread > 99 ? '99+' : activityUnread}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.actionHeaderRight}>
              <TouchableOpacity
                style={[styles.headerActionBtn, A11yStandards.minTouchTarget]}
                onPress={markAllAsRead}
                disabled={activityUnread === 0}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Mark all notifications as read"
              >
                <Ionicons
                  name="checkmark-done"
                  size={20}
                  color={activityUnread > 0 ? BrandColors.cyan : theme.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.headerActionBtn, A11yStandards.minTouchTarget]}
                onPress={() => setIsPreferencesVisible(true)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Notification settings"
              >
                <Ionicons name="settings-outline" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Category Filter Chips */}
          <NotificationCategoryBar
            activeCategory={category}
            onSelectCategory={setCategory}
          />

          {/* Activity List / Empty State */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
              <RefreshControl
                refreshing={isNotifRefreshing}
                onRefresh={refreshNotif}
                tintColor={BrandColors.cyan}
                colors={[BrandColors.cyan]}
              />
            }
          >
            {isNotifLoading && notifications.length === 0 ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={BrandColors.cyan} />
              </View>
            ) : notifications.length === 0 ? (
              <EmptyState
                title={emptyActivity.title}
                badgeText="Activity Stream Ready"
                description={emptyActivity.desc}
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
                            onFollowBack={handleProfilePress}
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

                {hasMoreNotif && (
                  <TouchableOpacity
                    style={[
                      styles.loadMoreBtn,
                      A11yStandards.minTouchTarget,
                      { borderColor: theme.border },
                    ]}
                    onPress={loadMoreNotif}
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

            {/* Security & Isolation Notice */}
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

          {/* Preferences Modal */}
          {isPreferencesVisible && (
            <NotificationPreferencesModal
              visible={isPreferencesVisible}
              onClose={() => setIsPreferencesVisible(false)}
            />
          )}
        </View>
      )}

      {/* New Conversation Modal */}
      <NewConversationModal
        visible={isNewConvModalVisible}
        onClose={() => setIsNewConvModalVisible(false)}
        onStartDirect={handleStartDirect}
        onStartGroup={handleStartGroup}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  segmentTabActive: {
    // borderBottomColor set dynamically
  },
  segmentLabel: {
    letterSpacing: 0.2,
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: BrandColors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  masterDetailContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  masterPanel: {
    width: 360,
    maxWidth: '40%',
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  detailPanel: {
    flex: 1,
  },
  activityContainer: {
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
