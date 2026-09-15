import { useState, useCallback, useEffect } from 'react';
import { FollowState } from '../types';
import { IProfileService, profileService, FollowCoordinator } from '../service';

export interface UseFollowReturn {
  followState: FollowState;
  isFollowing: boolean;
  isRequested: boolean;
  isLoading: boolean;
  error: string | null;
  toggleFollow: () => Promise<void>;
  cancelRequest: () => Promise<void>;
}

export function useFollow(
  targetUserId: string,
  initialState: FollowState = 'none',
  isPrivate = false,
  service: IProfileService = profileService
): UseFollowReturn {
  const [followState, setFollowState] = useState<FollowState>(
    FollowCoordinator.getCachedState(targetUserId) || initialState
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = FollowCoordinator.getCachedState(targetUserId);
    if (cached) {
      setFollowState(cached);
    }
  }, [targetUserId]);

  useEffect(() => {
    const unsubscribe = FollowCoordinator.subscribe((event) => {
      if (event.userId === targetUserId) {
        setFollowState(event.followState);
      }
    });
    return unsubscribe;
  }, [targetUserId]);

  const toggleFollow = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    const previousState = followState;

    if (followState === 'following') {
      // Unfollow
      setFollowState('none');
      try {
        await service.unfollowUser(targetUserId);
      } catch (err: any) {
        setFollowState(previousState);
        setError(err.message || 'Failed to unfollow user');
      } finally {
        setIsLoading(false);
      }
    } else if (followState === 'requested') {
      // Cancel request
      setFollowState('none');
      try {
        await service.cancelFollowRequest(targetUserId);
      } catch (err: any) {
        setFollowState(previousState);
        setError(err.message || 'Failed to cancel follow request');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Follow (or request if private)
      const next: FollowState = isPrivate ? 'requested' : 'following';
      setFollowState(next);
      try {
        await service.followUser(targetUserId, isPrivate);
      } catch (err: any) {
        setFollowState(previousState);
        setError(err.message || 'Failed to follow user');
      } finally {
        setIsLoading(false);
      }
    }
  }, [followState, isLoading, targetUserId, isPrivate, service]);

  const cancelRequest = useCallback(async () => {
    if (isLoading || followState !== 'requested') return;
    setIsLoading(true);
    setError(null);
    const previousState = followState;
    setFollowState('none');

    try {
      await service.cancelFollowRequest(targetUserId);
    } catch (err: any) {
      setFollowState(previousState);
      setError(err.message || 'Failed to cancel request');
    } finally {
      setIsLoading(false);
    }
  }, [followState, isLoading, targetUserId, service]);

  return {
    followState,
    isFollowing: followState === 'following',
    isRequested: followState === 'requested',
    isLoading,
    error,
    toggleFollow,
    cancelRequest,
  };
}
