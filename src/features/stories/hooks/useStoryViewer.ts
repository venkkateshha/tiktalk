import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Story,
  StoryUserGroup,
  StoryReactionType,
  StoryViewerStatus,
} from '../types';
import { storyService } from '../service';

export interface UseStoryViewerOptions {
  userGroups: StoryUserGroup[];
  initialUserId?: string;
  initialStoryId?: string;
  onClose: () => void;
}

export interface UseStoryViewerResult {
  currentGroup: StoryUserGroup | null;
  currentStory: Story | null;
  currentGroupIndex: number;
  currentStoryIndex: number;
  totalStoriesInGroup: number;
  progress: number; // 0.0 to 1.0
  status: StoryViewerStatus;
  isPaused: boolean;
  isMuted: boolean;
  activeReaction?: StoryReactionType;
  togglePause: () => void;
  pause: () => void;
  resume: () => void;
  toggleMute: () => void;
  nextStory: () => void;
  prevStory: () => void;
  react: (reaction: StoryReactionType) => Promise<void>;
  unreact: () => Promise<void>;
  reply: (text: string, reaction?: StoryReactionType) => Promise<void>;
  deleteCurrentStory: () => Promise<void>;
}

export const useStoryViewer = ({
  userGroups,
  initialUserId,
  initialStoryId,
  onClose,
}: UseStoryViewerOptions): UseStoryViewerResult => {
  // 1. Calculate initial indices
  const findInitialGroupIndex = (): number => {
    if (!initialUserId || userGroups.length === 0) return 0;
    const idx = userGroups.findIndex(
      (g) => g.userId === initialUserId || g.username === initialUserId
    );
    return idx >= 0 ? idx : 0;
  };

  const [groupIndex, setGroupIndex] = useState<number>(findInitialGroupIndex);
  const [storyIndex, setStoryIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [status, setStatus] = useState<StoryViewerStatus>('playing');
  const [activeReaction, setActiveReaction] = useState<StoryReactionType | undefined>();

  const currentGroup = userGroups[groupIndex] || null;
  const currentStory = currentGroup?.stories[storyIndex] || null;
  const totalStoriesInGroup = currentGroup?.stories.length || 0;

  // Initialize initial group and story index if initial values passed
  useEffect(() => {
    if (userGroups.length > 0 && initialUserId) {
      const idx = userGroups.findIndex(
        (g) => g.userId === initialUserId || g.username === initialUserId
      );
      if (idx >= 0) {
        setGroupIndex(idx);
      }
    }
  }, [userGroups, initialUserId]);

  useEffect(() => {
    if (initialStoryId && currentGroup) {
      const idx = currentGroup.stories.findIndex((s) => s.id === initialStoryId);
      if (idx >= 0) {
        setStoryIndex(idx);
      }
    }
  }, [initialStoryId, currentGroup]);

  // Sync active reaction from current story
  useEffect(() => {
    if (currentStory) {
      setActiveReaction(currentStory.myReaction);
      // Mark viewed immediately
      storyService.markViewed(currentStory.id).catch(() => {});
    }
    setProgress(0);
  }, [currentStory?.id]);

  // Timer Ref for progress animation (50ms interval)
  const timerRef = useRef<any>(null);
  const durationSeconds = currentStory?.durationSeconds || 5;
  const stepIncrement = 0.05 / durationSeconds; // 50ms / (duration in seconds)

  const advanceStory = useCallback(() => {
    if (!currentGroup) {
      onClose();
      return;
    }

    if (storyIndex < totalStoriesInGroup - 1) {
      // Advance to next story in current group
      setStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      // Advance to next user group
      if (groupIndex < userGroups.length - 1) {
        setGroupIndex((prev) => prev + 1);
        setStoryIndex(0);
        setProgress(0);
      } else {
        // Last story of last group -> close
        onClose();
      }
    }
  }, [currentGroup, storyIndex, totalStoriesInGroup, groupIndex, userGroups.length, onClose]);

  const prevStory = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
      setProgress(0);
    } else if (groupIndex > 0) {
      // Move to previous user group's last story
      const prevGroup = userGroups[groupIndex - 1];
      setGroupIndex((prev) => prev - 1);
      setStoryIndex(Math.max(0, prevGroup.stories.length - 1));
      setProgress(0);
    } else {
      // Already at first story of first user -> reset progress
      setProgress(0);
    }
  }, [storyIndex, groupIndex, userGroups]);

  // Progress ticker effect
  useEffect(() => {
    if (isPaused || status === 'paused' || !currentStory) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + stepIncrement;
        if (next >= 1) {
          advanceStory();
          return 0;
        }
        return next;
      });
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, status, currentStory, stepIncrement, advanceStory]);

  const pause = useCallback(() => {
    setIsPaused(true);
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
    setStatus('playing');
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const next = !prev;
      setStatus(next ? 'paused' : 'playing');
      return next;
    });
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // Optimistic reaction with rollback
  const react = useCallback(
    async (reaction: StoryReactionType) => {
      if (!currentStory) return;
      const prevReaction = activeReaction;
      setActiveReaction(reaction); // Optimistic

      try {
        await storyService.reactToStory(currentStory.id, reaction);
      } catch (err) {
        // Rollback on failure
        setActiveReaction(prevReaction);
        throw err;
      }
    },
    [currentStory, activeReaction]
  );

  const unreact = useCallback(async () => {
    if (!currentStory) return;
    const prevReaction = activeReaction;
    setActiveReaction(undefined); // Optimistic

    try {
      await storyService.removeReaction(currentStory.id);
    } catch (err) {
      setActiveReaction(prevReaction);
      throw err;
    }
  }, [currentStory, activeReaction]);

  const reply = useCallback(
    async (text: string, reaction?: StoryReactionType) => {
      if (!currentStory) return;
      await storyService.replyToStory(currentStory.id, text, reaction);
    },
    [currentStory]
  );

  const deleteCurrentStory = useCallback(async () => {
    if (!currentStory) return;
    await storyService.deleteStory(currentStory.id);
    advanceStory();
  }, [currentStory, advanceStory]);

  return {
    currentGroup,
    currentStory,
    currentGroupIndex: groupIndex,
    currentStoryIndex: storyIndex,
    totalStoriesInGroup,
    progress,
    status,
    isPaused,
    isMuted,
    activeReaction,
    togglePause,
    pause,
    resume,
    toggleMute,
    nextStory: advanceStory,
    prevStory,
    react,
    unreact,
    reply,
    deleteCurrentStory,
  };
};
