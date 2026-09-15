/**
 * TikTalk Phase 7: useEngagement Hook
 * Manages like, save, repost interactions for a specific post.
 * Synchronizes with EngagementCoordinator for instant cross-screen consistency.
 */

import { useState, useEffect, useCallback } from 'react';
import { PostEngagementState } from '../../../domain/engagement';
import {
  EngagementCoordinator,
  engagementService,
  IEngagementService,
} from '../../../services/engagement';

export interface UseEngagementProps {
  postId: string;
  initialState?: Partial<PostEngagementState>;
  service?: IEngagementService;
}

export interface UseEngagementReturn {
  state: PostEngagementState;
  toggleLike: () => Promise<void>;
  toggleSave: () => Promise<void>;
  toggleRepost: () => Promise<void>;
}

export function useEngagement({
  postId,
  initialState,
  service = engagementService,
}: UseEngagementProps): UseEngagementReturn {
  const [state, setState] = useState<PostEngagementState>(() => {
    const cached = EngagementCoordinator.getCachedState(postId);
    if (cached) return cached;
    return {
      postId,
      hasLiked: initialState?.hasLiked ?? false,
      likeCount: initialState?.likeCount,
      hasBookmarked: initialState?.hasBookmarked ?? false,
      bookmarkCount: initialState?.bookmarkCount,
      hasReposted: initialState?.hasReposted ?? false,
      repostCount: initialState?.repostCount,
      commentCount: initialState?.commentCount,
      shareCount: initialState?.shareCount,
    };
  });

  // Listen for external updates from other screens/components
  useEffect(() => {
    const unsubscribe = EngagementCoordinator.subscribe((event) => {
      if (event.postId === postId && event.state) {
        setState((prev) => ({
          ...prev,
          ...event.state,
        }));
      }
    });

    return unsubscribe;
  }, [postId]);

  const toggleLike = useCallback(async () => {
    try {
      const updated = await service.toggleLike(postId, state.hasLiked, state.likeCount);
      setState(updated);
    } catch {
      // Revert if error
    }
  }, [postId, service, state.hasLiked, state.likeCount]);

  const toggleSave = useCallback(async () => {
    try {
      const updated = await service.toggleSave(
        postId,
        state.hasBookmarked,
        state.bookmarkCount
      );
      setState(updated);
    } catch {
      // Revert if error
    }
  }, [postId, service, state.hasBookmarked, state.bookmarkCount]);

  const toggleRepost = useCallback(async () => {
    try {
      const updated = await service.toggleRepost(
        postId,
        state.hasReposted,
        state.repostCount
      );
      setState(updated);
    } catch {
      // Revert if error
    }
  }, [postId, service, state.hasReposted, state.repostCount]);

  return {
    state,
    toggleLike,
    toggleSave,
    toggleRepost,
  };
}
