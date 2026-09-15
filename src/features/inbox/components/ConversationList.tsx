/**
 * TikTalk Phase 9: ConversationList Component
 * Displays the searchable, filterable list of conversations with honest empty states.
 * ZERO fake data.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Conversation } from '../../../domain/chat';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { EmptyState } from '../../../components/ui/EmptyState';
import { A11yStandards } from '../../../core/a11y/a11yStandards';
import { ConversationRow } from './ConversationRow';

export interface ConversationListProps {
  conversations: Conversation[];
  activeFilter: 'all' | 'unread' | 'archived';
  searchQuery: string;
  isLoading: boolean;
  isRefreshing: boolean;
  selectedId?: string | null;
  onFilterChange: (filter: 'all' | 'unread' | 'archived') => void;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  onSelectConversation: (conversation: Conversation) => void;
  onNewConversation: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeFilter,
  searchQuery,
  isLoading,
  isRefreshing,
  selectedId,
  onFilterChange,
  onSearchChange,
  onRefresh,
  onSelectConversation,
  onNewConversation,
}) => {
  const { theme, typography } = useTheme();

  const getEmptyStateDetails = () => {
    if (searchQuery.trim()) {
      return {
        title: 'No Results Found',
        desc: `No conversations matching "${searchQuery}".`,
        icon: 'search-outline' as const,
      };
    }
    if (activeFilter === 'unread') {
      return {
        title: 'No Unread Messages',
        desc: 'You are all caught up! New incoming messages will appear here.',
        icon: 'checkmark-circle-outline' as const,
      };
    }
    if (activeFilter === 'archived') {
      return {
        title: 'No Archived Messages',
        desc: 'Conversations you archive will be kept safe and tucked away here.',
        icon: 'archive-outline' as const,
      };
    }
    return {
      title: 'No Messages Yet',
      desc: 'Send a direct message or create a group chat with creators you follow.',
      icon: 'chatbubbles-outline' as const,
    };
  };

  const emptyDetails = getEmptyStateDetails();

  return (
    <View style={styles.container}>
      {/* 1. Search Bar & New Chat Action */}
      <View style={[styles.searchContainer, { borderBottomColor: theme.border }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search" size={18} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text, fontSize: typography.fontSize.sm }]}
            placeholder="Search conversations..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={onSearchChange}
            clearButtonMode="while-editing"
            accessible={true}
            accessibilityLabel="Search conversations"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => onSearchChange('')}
              style={styles.clearSearchBtn}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.newChatBtn, A11yStandards.minTouchTarget, { backgroundColor: BrandColors.cyan }]}
          onPress={onNewConversation}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Start new conversation"
        >
          <Ionicons name="create-outline" size={20} color={BrandColors.black} />
        </TouchableOpacity>
      </View>

      {/* 2. Filter Tabs (All, Unread, Archived) */}
      <View style={[styles.filterBar, { borderBottomColor: theme.border }]}>
        {(['all', 'unread', 'archived'] as const).map((filterKey) => {
          const isActive = activeFilter === filterKey;
          const label = filterKey.charAt(0).toUpperCase() + filterKey.slice(1);
          return (
            <TouchableOpacity
              key={filterKey}
              style={[
                styles.filterChip,
                A11yStandards.minTouchTarget,
                {
                  backgroundColor: isActive ? BrandColors.cyan : theme.surface,
                  borderColor: isActive ? BrandColors.cyan : theme.border,
                },
              ]}
              onPress={() => onFilterChange(filterKey)}
              accessible={true}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${label} conversations filter`}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: isActive ? BrandColors.black : theme.text,
                    fontSize: typography.fontSize.xs,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Conversation List / Empty State */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={BrandColors.cyan}
            colors={[BrandColors.cyan]}
          />
        }
      >
        {isLoading && conversations.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={BrandColors.cyan} />
          </View>
        ) : conversations.length === 0 ? (
          <EmptyState
            title={emptyDetails.title}
            badgeText="Direct Messaging Ready"
            description={emptyDetails.desc}
            iconName={emptyDetails.icon}
          />
        ) : (
          <View style={[styles.cardContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {conversations.map((conv, idx) => (
              <View key={conv.id}>
                <ConversationRow
                  conversation={conv}
                  isSelected={selectedId === conv.id}
                  onPress={onSelectConversation}
                />
                {idx < conversations.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  newChatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {},
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 68,
  },
});
