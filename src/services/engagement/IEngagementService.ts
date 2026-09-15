/**
 * TikTalk Phase 7: Engagement Service Contract
 * Core operations for Like, Save/Bookmark, Repost, and state retrieval
 */

import { PostEngagementState } from '../../domain/engagement';

export interface IEngagementService {
  /**
   * Get current engagement state for a post. Checks local cache/storage first.
   */
  getEngagementState(postId: string): Promise<PostEngagementState>;

  /**
   * Toggle like state for a post.
   * Returns updated PostEngagementState.
   */
  toggleLike(postId: string, currentLiked: boolean, currentCount?: number): Promise<PostEngagementState>;

  /**
   * Toggle save/bookmark state for a post.
   * Returns updated PostEngagementState.
   */
  toggleSave(postId: string, currentSaved: boolean, currentCount?: number): Promise<PostEngagementState>;

  /**
   * Toggle repost state for a post.
   * Returns updated PostEngagementState.
   */
  toggleRepost(postId: string, currentReposted: boolean, currentCount?: number): Promise<PostEngagementState>;

  /**
   * Get all saved/bookmarked post IDs.
   */
  getSavedPostIds(): Promise<string[]>;

  /**
   * Get all liked post IDs.
   */
  getLikedPostIds(): Promise<string[]>;

  /**
   * Get all reposted post IDs.
   */
  getRepostedPostIds(): Promise<string[]>;

  /**
   * Reset/clear local engagement storage (for testing).
   */
  clear(): Promise<void>;
}
