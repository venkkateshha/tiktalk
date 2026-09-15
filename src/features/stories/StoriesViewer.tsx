import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableWithoutFeedback,
  Platform,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useNavigation } from '../../navigation';
import { StoriesRouteParams } from '../../navigation/types';
import { useStories } from './hooks/useStories';
import { useStoryViewer } from './hooks/useStoryViewer';
import {
  StoryProgressBar,
  StoryHeader,
  StoryMediaView,
  StoryBottomBar,
  StoryViewersModal,
} from './components';

export interface StoriesViewerProps {
  params: StoriesRouteParams;
}

export const StoriesViewer: React.FC<StoriesViewerProps> = ({ params }) => {
  const { brandColors, typography } = useTheme();
  const { closeStories } = useNavigation();
  const { storyGroups, status: storiesStatus, muteUser, refresh } = useStories();

  const [isViewersModalOpen, setIsViewersModalOpen] = useState(false);

  // Initialize interactive story viewer hook
  const viewer = useStoryViewer({
    userGroups: storyGroups,
    initialUserId: params.userId,
    initialStoryId: params.initialStoryId,
    onClose: closeStories,
  });

  const {
    currentGroup,
    currentStory,
    currentStoryIndex,
    totalStoriesInGroup,
    progress,
    isMuted,
    activeReaction,
    togglePause,
    pause,
    resume,
    toggleMute,
    nextStory,
    prevStory,
    react,
    unreact,
    reply,
    deleteCurrentStory,
  } = viewer;

  const isOwner =
    currentGroup?.userId === 'me' ||
    currentGroup?.username === 'tiktalk.creator' ||
    currentStory?.creatorId === 'me' ||
    currentStory?.creatorUsername === 'tiktalk.creator';

  // Keyboard navigation on Web (Escape closes, Arrows navigate, Space pauses/resumes)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in an input
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') {
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement)?.blur();
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        closeStories();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextStory();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevStory();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeStories, nextStory, prevStory, togglePause]);

  // Loading or empty state handling
  if ((storiesStatus === 'loading' || storiesStatus === 'idle') && storyGroups.length === 0) {
    return (
      <SafeAreaView style={[styles.overlay, { backgroundColor: brandColors.black }]}>
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={brandColors.cyan} />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentGroup || !currentStory) {
    return (
      <SafeAreaView style={[styles.overlay, { backgroundColor: brandColors.black }]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="sparkles-outline" size={48} color="rgba(255,255,255,0.4)" />
          <Text style={[styles.emptyTitle, { color: brandColors.white }]}>
            No Active Stories
          </Text>
          <Text style={styles.emptySubtitle}>
            Stories expire after 24 hours. Check back later or create your own!
          </Text>
          <TouchableOpacity
            onPress={closeStories}
            style={[styles.closeEmptyBtn, { backgroundColor: brandColors.cyan }]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Close story viewer"
          >
            <Text style={{ color: brandColors.black, fontWeight: '700' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.overlay, { backgroundColor: brandColors.black }]}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel={`Story viewer for user ${currentGroup.username}`}
    >
      <View style={styles.responsiveWrapper}>
        {/* 1. Top Bar: Progress Segments & Story Header */}
        <View style={styles.topSection}>
          <StoryProgressBar
            totalStories={totalStoriesInGroup}
            currentIndex={currentStoryIndex}
            currentProgress={progress}
          />
          <StoryHeader
            group={currentGroup}
            story={currentStory}
            isOwner={Boolean(isOwner)}
            onClose={closeStories}
            onMuteUser={() => muteUser(currentGroup.userId)}
            onDeleteStory={async () => {
              await deleteCurrentStory();
              await refresh();
            }}
            onPause={pause}
            onResume={resume}
          />
        </View>

        {/* 2. Center Media Canvas with Left/Right Touch Controls & Press-to-Pause */}
        <View style={styles.viewportArea}>
          <StoryMediaView
            story={currentStory}
            isMuted={isMuted}
            onToggleMute={toggleMute}
          />

          {/* Left Tap Zone (Previous Story) */}
          <TouchableWithoutFeedback
            onPress={prevStory}
            onPressIn={pause}
            onPressOut={resume}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Previous story"
          >
            <View style={styles.leftTapZone} />
          </TouchableWithoutFeedback>

          {/* Right Tap Zone (Next Story) */}
          <TouchableWithoutFeedback
            onPress={nextStory}
            onPressIn={pause}
            onPressOut={resume}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Next story"
          >
            <View style={styles.rightTapZone} />
          </TouchableWithoutFeedback>
        </View>

        {/* 3. Bottom Bar: Reactions, Reply Input, Owner View Count */}
        <View style={styles.bottomSection}>
          <StoryBottomBar
            story={currentStory}
            isOwner={Boolean(isOwner)}
            activeReaction={activeReaction}
            onReact={react}
            onUnreact={unreact}
            onReply={reply}
            onOpenViewers={() => {
              pause();
              setIsViewersModalOpen(true);
            }}
            onPause={pause}
            onResume={resume}
          />
        </View>

        {/* 4. Owner Viewers Sheet Modal */}
        {isOwner && (
          <StoryViewersModal
            visible={isViewersModalOpen}
            storyId={currentStory.id}
            onClose={() => {
              setIsViewersModalOpen(false);
              resume();
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  responsiveWrapper: {
    width: '100%',
    height: '100%',
    maxWidth: 440, // Centered 9:16 ratio on web and tablet
    alignSelf: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  closeEmptyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSection: {
    width: '100%',
    paddingTop: 8,
    zIndex: 20,
  },
  viewportArea: {
    flex: 1,
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftTapZone: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '35%',
    zIndex: 10,
  },
  rightTapZone: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '65%',
    zIndex: 10,
  },
  bottomSection: {
    width: '100%',
    zIndex: 20,
  },
});
