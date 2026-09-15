/**
 * TikTalk Phase 6: Story Event Coordinator
 * Synchronizes story publishing, viewing, reactions, and archiving
 * across Home Feed Rail, Profile Header, and Story Viewer in real time.
 */

export type StoryEventType = 'created' | 'deleted' | 'viewed' | 'reacted' | 'archived';

export interface StoryEvent {
  type: StoryEventType;
  storyId?: string;
  creatorId?: string;
  timestamp: string;
}

type StoryListener = (event: StoryEvent) => void;

class StoryCoordinatorClass {
  private listeners: Set<StoryListener> = new Set();

  subscribe(listener: StoryListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify(event: StoryEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch {
        // Safe execution
      }
    });
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const StoryCoordinator = new StoryCoordinatorClass();
