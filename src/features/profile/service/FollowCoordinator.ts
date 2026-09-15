import { FollowEvent, FollowState } from '../types';

type FollowListener = (event: FollowEvent) => void;

class FollowCoordinatorClass {
  private listeners: Set<FollowListener> = new Set();
  private stateCache: Map<string, FollowState> = new Map();

  subscribe(listener: FollowListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify(event: FollowEvent): void {
    this.stateCache.set(event.userId, event.followState);
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch {
        // Safe listener execution
      }
    });
  }

  getCachedState(userId: string): FollowState | undefined {
    return this.stateCache.get(userId);
  }

  setCachedState(userId: string, state: FollowState): void {
    this.stateCache.set(userId, state);
  }

  clear(): void {
    this.stateCache.clear();
    this.listeners.clear();
  }
}

export const FollowCoordinator = new FollowCoordinatorClass();
