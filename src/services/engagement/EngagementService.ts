/**
 * TikTalk Phase 7: Engagement Service Implementation
 * Cross-platform persistence + optimistic states + coordinator sync
 */

import { PostEngagementState } from '../../domain/engagement';
import { IStorageService, storageService } from '../storage';
import { IEngagementService } from './IEngagementService';
import { EngagementCoordinator } from './EngagementCoordinator';

const STORAGE_KEY_SAVED_IDS = 'tiktalk_saved_posts';
const STORAGE_KEY_LIKED_IDS = 'tiktalk_liked_posts';
const STORAGE_KEY_REPOSTED_IDS = 'tiktalk_reposted_posts';
const STORAGE_KEY_POST_PREFIX = 'tiktalk_engagement_';

export class EngagementService implements IEngagementService {
  constructor(private storage: IStorageService = storageService) {}

  async getEngagementState(postId: string): Promise<PostEngagementState> {
    // 1. Check memory coordinator
    const cached = EngagementCoordinator.getCachedState(postId);
    if (cached) return cached;

    // 2. Check persistent storage
    try {
      const stored = await this.storage.getItem<PostEngagementState>(
        `${STORAGE_KEY_POST_PREFIX}${postId}`
      );
      if (stored) {
        EngagementCoordinator.setCachedState(postId, stored);
        return stored;
      }
    } catch {
      // Fallback
    }

    // 3. Check membership lists
    const [savedIds, likedIds, repostedIds] = await Promise.all([
      this.getSavedPostIds(),
      this.getLikedPostIds(),
      this.getRepostedPostIds(),
    ]);

    const state: PostEngagementState = {
      postId,
      hasLiked: likedIds.includes(postId),
      hasBookmarked: savedIds.includes(postId),
      hasReposted: repostedIds.includes(postId),
    };

    EngagementCoordinator.setCachedState(postId, state);
    return state;
  }

  async toggleLike(
    postId: string,
    currentLiked: boolean,
    currentCount?: number
  ): Promise<PostEngagementState> {
    if (EngagementCoordinator.isMutating(postId, 'like')) {
      // Return cached state if mutation already in flight
      return (
        EngagementCoordinator.getCachedState(postId) || {
          postId,
          hasLiked: currentLiked,
          likeCount: currentCount,
          hasBookmarked: false,
          hasReposted: false,
        }
      );
    }

    EngagementCoordinator.setMutating(postId, 'like', true);

    try {
      const nextLiked = !currentLiked;
      let nextCount: number | undefined;
      if (typeof currentCount === 'number') {
        nextCount = nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1);
      }

      const existing = await this.getEngagementState(postId);
      const updatedState: PostEngagementState = {
        ...existing,
        hasLiked: nextLiked,
        likeCount: nextCount,
      };

      // Broadcast and cache
      EngagementCoordinator.notify({
        type: 'like',
        postId,
        state: updatedState,
      });

      // Update storage
      await this.storage.setItem(
        `${STORAGE_KEY_POST_PREFIX}${postId}`,
        updatedState
      );

      const likedIds = await this.getLikedPostIds();
      const nextLikedIds = nextLiked
        ? Array.from(new Set([...likedIds, postId]))
        : likedIds.filter((id) => id !== postId);
      await this.storage.setItem(STORAGE_KEY_LIKED_IDS, nextLikedIds);

      return updatedState;
    } finally {
      EngagementCoordinator.setMutating(postId, 'like', false);
    }
  }

  async toggleSave(
    postId: string,
    currentSaved: boolean,
    currentCount?: number
  ): Promise<PostEngagementState> {
    if (EngagementCoordinator.isMutating(postId, 'save')) {
      return (
        EngagementCoordinator.getCachedState(postId) || {
          postId,
          hasLiked: false,
          hasBookmarked: currentSaved,
          bookmarkCount: currentCount,
          hasReposted: false,
        }
      );
    }

    EngagementCoordinator.setMutating(postId, 'save', true);

    try {
      const nextSaved = !currentSaved;
      let nextCount: number | undefined;
      if (typeof currentCount === 'number') {
        nextCount = nextSaved ? currentCount + 1 : Math.max(0, currentCount - 1);
      }

      const existing = await this.getEngagementState(postId);
      const updatedState: PostEngagementState = {
        ...existing,
        hasBookmarked: nextSaved,
        bookmarkCount: nextCount,
      };

      EngagementCoordinator.notify({
        type: 'save',
        postId,
        state: updatedState,
      });

      await this.storage.setItem(
        `${STORAGE_KEY_POST_PREFIX}${postId}`,
        updatedState
      );

      const savedIds = await this.getSavedPostIds();
      const nextSavedIds = nextSaved
        ? Array.from(new Set([...savedIds, postId]))
        : savedIds.filter((id) => id !== postId);
      await this.storage.setItem(STORAGE_KEY_SAVED_IDS, nextSavedIds);

      return updatedState;
    } finally {
      EngagementCoordinator.setMutating(postId, 'save', false);
    }
  }

  async toggleRepost(
    postId: string,
    currentReposted: boolean,
    currentCount?: number
  ): Promise<PostEngagementState> {
    if (EngagementCoordinator.isMutating(postId, 'repost')) {
      return (
        EngagementCoordinator.getCachedState(postId) || {
          postId,
          hasLiked: false,
          hasBookmarked: false,
          hasReposted: currentReposted,
          repostCount: currentCount,
        }
      );
    }

    EngagementCoordinator.setMutating(postId, 'repost', true);

    try {
      const nextReposted = !currentReposted;
      let nextCount: number | undefined;
      if (typeof currentCount === 'number') {
        nextCount = nextReposted ? currentCount + 1 : Math.max(0, currentCount - 1);
      }

      const existing = await this.getEngagementState(postId);
      const updatedState: PostEngagementState = {
        ...existing,
        hasReposted: nextReposted,
        repostCount: nextCount,
      };

      EngagementCoordinator.notify({
        type: 'repost',
        postId,
        state: updatedState,
      });

      await this.storage.setItem(
        `${STORAGE_KEY_POST_PREFIX}${postId}`,
        updatedState
      );

      const repostedIds = await this.getRepostedPostIds();
      const nextRepostedIds = nextReposted
        ? Array.from(new Set([...repostedIds, postId]))
        : repostedIds.filter((id) => id !== postId);
      await this.storage.setItem(STORAGE_KEY_REPOSTED_IDS, nextRepostedIds);

      return updatedState;
    } finally {
      EngagementCoordinator.setMutating(postId, 'repost', false);
    }
  }

  async getSavedPostIds(): Promise<string[]> {
    try {
      const ids = await this.storage.getItem<string[]>(STORAGE_KEY_SAVED_IDS);
      return Array.isArray(ids) ? ids : [];
    } catch {
      return [];
    }
  }

  async getLikedPostIds(): Promise<string[]> {
    try {
      const ids = await this.storage.getItem<string[]>(STORAGE_KEY_LIKED_IDS);
      return Array.isArray(ids) ? ids : [];
    } catch {
      return [];
    }
  }

  async getRepostedPostIds(): Promise<string[]> {
    try {
      const ids = await this.storage.getItem<string[]>(STORAGE_KEY_REPOSTED_IDS);
      return Array.isArray(ids) ? ids : [];
    } catch {
      return [];
    }
  }

  async clear(): Promise<void> {
    EngagementCoordinator.clear();
    await this.storage.removeItem(STORAGE_KEY_SAVED_IDS);
    await this.storage.removeItem(STORAGE_KEY_LIKED_IDS);
    await this.storage.removeItem(STORAGE_KEY_REPOSTED_IDS);
  }
}

export const engagementService = new EngagementService();
