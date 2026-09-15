import { useState, useEffect, useCallback } from 'react';
import { StoryUserGroup, Story } from '../types';
import { storyService, StoryCoordinator } from '../service';

export interface UseStoriesResult {
  storyGroups: StoryUserGroup[];
  currentUserStories: Story[];
  hasUserStory: boolean;
  status: 'idle' | 'loading' | 'success' | 'empty' | 'error';
  errorMessage?: string;
  refresh: () => Promise<void>;
  muteUser: (userId: string) => Promise<void>;
  unmuteUser: (userId: string) => Promise<void>;
}

export const useStories = (): UseStoriesResult => {
  const [storyGroups, setStoryGroups] = useState<StoryUserGroup[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'empty' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const refresh = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(undefined);

    const controller = new AbortController();
    try {
      const groups = await storyService.getActiveStories(controller.signal);
      setStoryGroups(groups);
      setStatus(groups.length > 0 ? 'success' : 'empty');
    } catch (err) {
      if (controller.signal.aborted) return;
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load stories');
    }
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = StoryCoordinator.subscribe(() => {
      refresh();
    });
    return unsubscribe;
  }, [refresh]);

  const muteUser = useCallback(
    async (userId: string) => {
      await storyService.muteStories(userId);
      await refresh();
    },
    [refresh]
  );

  const unmuteUser = useCallback(
    async (userId: string) => {
      await storyService.unmuteStories(userId);
      await refresh();
    },
    [refresh]
  );

  // Separate current user's active stories
  const userGroup = storyGroups.find((g) => g.userId === 'me' || g.username === 'tiktalk.creator');
  const currentUserStories = userGroup ? userGroup.stories : [];
  const hasUserStory = currentUserStories.length > 0;

  return {
    storyGroups,
    currentUserStories,
    hasUserStory,
    status,
    errorMessage,
    refresh,
    muteUser,
    unmuteUser,
  };
};
