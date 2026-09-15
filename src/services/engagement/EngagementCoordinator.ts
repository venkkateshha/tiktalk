/**
 * TikTalk Phase 7: Engagement Event Coordinator
 * Global event coordinator for post engagements (Likes, Saves, Reposts, Comments)
 * Ensures cross-screen consistency between Feed, Discover, and Profile.
 */

import { PostEngagementState } from '../../domain/engagement';

export type EngagementEventType =
  | 'like'
  | 'save'
  | 'repost'
  | 'comment_added'
  | 'comment_deleted'
  | 'share';

export interface EngagementEvent {
  type: EngagementEventType;
  postId: string;
  state?: Partial<PostEngagementState>;
}

type EngagementListener = (event: EngagementEvent) => void;

class EngagementCoordinatorClass {
  private listeners: Set<EngagementListener> = new Set();
  private stateCache: Map<string, PostEngagementState> = new Map();
  private inFlightMutations: Set<string> = new Set();

  /**
   * Subscribe to engagement updates across all screens.
   * Returns an unsubscribe callback.
   */
  subscribe(listener: EngagementListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Broadcast an engagement change to all active subscribers.
   */
  notify(event: EngagementEvent): void {
    if (event.state) {
      const existing = this.stateCache.get(event.postId) || {
        postId: event.postId,
        hasLiked: false,
        hasBookmarked: false,
        hasReposted: false,
      };
      this.stateCache.set(event.postId, {
        ...existing,
        ...event.state,
      });
    }

    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch {
        // Safe listener execution: subscriber failures do not crash coordinator
      }
    });
  }

  /**
   * Get cached engagement state for a post.
   */
  getCachedState(postId: string): PostEngagementState | undefined {
    return this.stateCache.get(postId);
  }

  /**
   * Update or initialize cached engagement state.
   */
  setCachedState(postId: string, state: PostEngagementState): void {
    this.stateCache.set(postId, state);
  }

  /**
   * Check if a mutation is already in-flight for this post and action.
   */
  isMutating(postId: string, action: string): boolean {
    return this.inFlightMutations.has(`${postId}:${action}`);
  }

  /**
   * Mark a mutation as in-flight or completed.
   */
  setMutating(postId: string, action: string, mutating: boolean): void {
    const key = `${postId}:${action}`;
    if (mutating) {
      this.inFlightMutations.add(key);
    } else {
      this.inFlightMutations.delete(key);
    }
  }

  /**
   * Clear all cached states and listeners (useful in tests).
   */
  clear(): void {
    this.stateCache.clear();
    this.listeners.clear();
    this.inFlightMutations.clear();
  }
}

export const EngagementCoordinator = new EngagementCoordinatorClass();
