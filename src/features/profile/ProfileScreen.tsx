import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useTheme } from '../../theme';
import { BrandColors } from '../../theme/colors';
import { Header } from '../../components/ui/Header';
import { useNavigation } from '../../navigation';
import { useProfile } from './hooks/useProfile';
import { useFollow } from './hooks/useFollow';
import {
  ProfileHeaderView,
  ProfileActionsDock,
  ProfileContentGrid,
  CreatorEconomicsCard,
  EditProfileModal,
  FollowListModal,
  ProfileStateView,
} from './components';
import { useStories } from '../stories/hooks/useStories';
import { StoryHighlightsBar, StoryArchiveModal } from '../stories/components';

export interface ProfileScreenProps {
  userId?: string;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ userId }) => {
  const { theme, typography } = useTheme();
  const { openStories, openStoryCreation } = useNavigation();

  const {
    profile,
    status,
    activeTab,
    videos,
    isLoadingVideos,
    errorMessage,
    isOwner,
    setActiveTab,
    refresh,
    updateProfileOptimistic,
  } = useProfile(userId);

  const stories = useStories();
  const hasActiveStory = isOwner
    ? stories.hasUserStory
    : Boolean(
        profile &&
          stories.storyGroups.some(
            (g) => g.userId === profile.id || g.username === profile.username
          )
      );

  const {
    followState,
    toggleFollow,
  } = useFollow(
    profile?.id || 'me',
    profile?.followState || 'none',
    profile?.isPrivate || false
  );

  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState<boolean>(false);
  const [followModalConfig, setFollowModalConfig] = useState<{
    visible: boolean;
    type: 'followers' | 'following';
  }>({
    visible: false,
    type: 'followers',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleOpenStory = () => {
    if (!profile) return;
    if (hasActiveStory) {
      openStories({
        userId: isOwner ? 'me' : profile.username,
        entryPoint: 'profile_avatar',
      });
    } else if (isOwner) {
      openStoryCreation();
    }
  };

  const handleShareProfile = () => {
    showToast(`Profile link copied: tiktalk.video/@${profile?.username}`);
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        activeFeed="forYou"
        onFeedChange={() => {}}
        showTabs={false}
        title={isOwner ? 'My Profile' : profile ? `@${profile.username}` : 'Profile'}
      />

      {/* Loading / Error / Offline View */}
      {status === 'loading' || status === 'error' || status === 'offline' || status === 'unavailable' ? (
        <ProfileStateView
          status={status}
          errorMessage={errorMessage}
          onRetry={refresh}
        />
      ) : profile ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Profile Header (Avatar, Names, Stats, Bio, Link) */}
          <ProfileHeaderView
            profile={profile}
            hasActiveStory={hasActiveStory}
            onOpenStory={handleOpenStory}
            onOpenFollowers={() => setFollowModalConfig({ visible: true, type: 'followers' })}
            onOpenFollowing={() => setFollowModalConfig({ visible: true, type: 'following' })}
          />

          {/* 2. Actions Dock (Follow / Edit Profile / Share / Archive for owner) */}
          <ProfileActionsDock
            isOwner={isOwner}
            followState={followState}
            isPrivate={profile.isPrivate}
            onEditProfile={() => setIsEditModalVisible(true)}
            onShareProfile={handleShareProfile}
            onToggleFollow={toggleFollow}
            onMessage={() => showToast('Direct messaging is available in Inbox')}
            onOptions={() => {
              if (isOwner) {
                setIsArchiveOpen(true);
              } else {
                showToast('More profile options');
              }
            }}
          />

          {/* 3. Story Highlights Bar (Foundation for profile highlights) */}
          <StoryHighlightsBar
            userId={profile.id}
            isOwner={isOwner}
            onSelectHighlight={(hl) => showToast(`Viewing highlight: ${hl.title}`)}
          />

          {/* 4. Creator Economics Foundation Card (for owner creator profiles) */}
          {profile.isCreator && isOwner && (
            <CreatorEconomicsCard
              onOpenStudio={() => showToast('Creator Studio foundation active')}
              onOpenWallet={() => showToast('Weekly Monday UPI payout ledger active')}
            />
          )}

          {/* 5. Content Grid or Private Locked State */}
          {status === 'private_locked' ? (
            <ProfileStateView status="private_locked" />
          ) : (
            <ProfileContentGrid
              activeTab={activeTab}
              videos={videos}
              isLoading={isLoadingVideos}
              onTabChange={setActiveTab}
              onSelectVideo={(video) => showToast(`Playing video: ${video.id}`)}
            />
          )}
        </ScrollView>
      ) : null}

      {/* Floating Toast Notice */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <View style={[styles.toastCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.toastText, { color: BrandColors.cyan, fontSize: typography.fontSize.xs }]}>
              {toastMessage}
            </Text>
          </View>
        </View>
      )}

      {/* Modals */}
      {profile && (
        <>
          <EditProfileModal
            visible={isEditModalVisible}
            profile={profile}
            onClose={() => setIsEditModalVisible(false)}
            onSaveSuccess={(updated) => {
              updateProfileOptimistic(updated);
              showToast('Profile updated successfully');
            }}
          />

          <FollowListModal
            visible={followModalConfig.visible}
            userId={profile.id}
            type={followModalConfig.type}
            onClose={() => setFollowModalConfig((prev) => ({ ...prev, visible: false }))}
            onSelectUser={(u) => {
              setFollowModalConfig((prev) => ({ ...prev, visible: false }));
              showToast(`Viewing @${u.username}`);
            }}
          />

          <StoryArchiveModal
            visible={isArchiveOpen}
            onClose={() => setIsArchiveOpen(false)}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 1000,
  },
  toastCard: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  toastText: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
