import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { FollowUserSummary } from '../types';
import { useFollowList } from '../hooks/useFollowList';
import { Avatar } from '../../../components/ui/Avatar';
import { VerificationBadge } from './VerificationBadge';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface FollowListModalProps {
  visible: boolean;
  userId: string;
  type: 'followers' | 'following';
  onClose: () => void;
  onSelectUser?: (user: FollowUserSummary) => void;
}

export const FollowListModal: React.FC<FollowListModalProps> = ({
  visible,
  userId,
  type,
  onClose,
  onSelectUser,
}) => {
  const { theme, typography } = useTheme();
  const {
    filteredUsers,
    searchQuery,
    isLoading,
    error,
    setSearchQuery,
    toggleFollowUser,
  } = useFollowList(userId, type);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Close modal backdrop"
        />
        <View
          style={[
            styles.sheetContainer,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          accessible={true}
          accessibilityRole="none"
          accessibilityLabel={`${type === 'followers' ? 'Followers' : 'Following'} list modal`}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, A11yStandards.minTouchTarget]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close list modal"
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>

            <Text style={[styles.title, { color: theme.text, fontSize: typography.fontSize.lg }]}>
              {type === 'followers' ? 'Followers' : 'Following'}
            </Text>

            <View style={styles.headerSpacer} />
          </View>

          {/* Search Input Bar */}
          <View style={styles.searchContainer}>
            <View
              style={[
                styles.searchBar,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder={`Search ${type}...`}
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                accessible={true}
                accessibilityLabel={`Search ${type}`}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={[styles.clearBtn, A11yStandards.minTouchTarget]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search query"
                >
                  <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* List Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={BrandColors.cyan} />
            </View>
          ) : error ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="alert-circle-outline" size={40} color={BrandColors.pink} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Unable to load {type}</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>{error}</Text>
            </View>
          ) : filteredUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: theme.card }]}>
                <Ionicons
                  name={type === 'followers' ? 'people-outline' : 'person-add-outline'}
                  size={36}
                  color={theme.textSecondary}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : type === 'followers'
                  ? 'No Followers Yet'
                  : 'Not Following Anyone Yet'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                {searchQuery
                  ? 'Try searching with a different name or handle'
                  : type === 'followers'
                  ? 'When users follow this profile, they will be listed here.'
                  : 'Follow creators to stay up to date with their latest 60 FPS videos.'}
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {filteredUsers.map((user) => {
                const isFollowing = user.followState === 'following';
                return (
                  <View
                    key={user.id}
                    style={[styles.userRow, { borderBottomColor: theme.border }]}
                    accessible={true}
                    accessibilityRole="none"
                    accessibilityLabel={`${user.displayName}, @${user.username}`}
                  >
                    {/* Avatar & User Info */}
                    <TouchableOpacity
                      onPress={() => {
                        if (onSelectUser) onSelectUser(user);
                      }}
                      style={styles.userInfoTouchable}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`View ${user.displayName}'s profile`}
                    >
                      <Avatar name={user.displayName} source={user.avatarUrl} size="md" />
                      <View style={styles.userTextContainer}>
                        <View style={styles.nameRow}>
                          <Text
                            style={[styles.displayNameText, { color: theme.text }]}
                            numberOfLines={1}
                          >
                            {user.displayName}
                          </Text>
                          <VerificationBadge
                            status={user.isVerified ? 'verified' : 'none'}
                            size={14}
                          />
                        </View>
                        <Text style={[styles.usernameText, { color: theme.textSecondary }]}>
                          @{user.username}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Follow / Unfollow Button */}
                    <TouchableOpacity
                      onPress={() => toggleFollowUser(user)}
                      style={[
                        styles.followBtn,
                        A11yStandards.minTouchTarget,
                        isFollowing
                          ? { backgroundColor: theme.card, borderColor: theme.border }
                          : { backgroundColor: BrandColors.pink, borderColor: BrandColors.pink },
                      ]}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isFollowing
                          ? `Unfollow ${user.displayName}`
                          : `Follow ${user.displayName}`
                      }
                    >
                      <Text
                        style={[
                          styles.followBtnText,
                          {
                            color: isFollowing ? theme.text : '#FFFFFF',
                            fontSize: typography.fontSize.xs,
                          },
                        ]}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    maxHeight: '80%',
    minHeight: '50%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  title: {
    fontWeight: '700',
  },
  headerSpacer: {
    width: 44,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  clearBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 280,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  userInfoTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  userTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  displayNameText: {
    fontSize: 14,
    fontWeight: '700',
  },
  usernameText: {
    fontSize: 12,
    marginTop: 2,
  },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBtnText: {
    fontWeight: '700',
  },
});
