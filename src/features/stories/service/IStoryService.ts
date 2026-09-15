import {
  Story,
  StoryUserGroup,
  CreateStoryInput,
  StoryReactionType,
  StoryReplyItem,
  StoryViewItem,
  StoryArchiveItem,
  StoryHighlight,
} from '../types';

export interface IStoryService {
  getActiveStories(signal?: AbortSignal): Promise<StoryUserGroup[]>;
  getUserStories(userId: string, signal?: AbortSignal): Promise<StoryUserGroup | null>;
  getStory(storyId: string, signal?: AbortSignal): Promise<Story | null>;
  createStory(input: CreateStoryInput, signal?: AbortSignal): Promise<Story>;
  publishStory(story: Story, signal?: AbortSignal): Promise<Story>;
  deleteStory(storyId: string, signal?: AbortSignal): Promise<void>;
  markViewed(storyId: string, signal?: AbortSignal): Promise<{ viewCount: number }>;
  reactToStory(storyId: string, reaction: StoryReactionType, signal?: AbortSignal): Promise<void>;
  removeReaction(storyId: string, signal?: AbortSignal): Promise<void>;
  replyToStory(
    storyId: string,
    text: string,
    reaction?: StoryReactionType,
    signal?: AbortSignal
  ): Promise<StoryReplyItem>;
  getStoryViewers(storyId: string, signal?: AbortSignal): Promise<StoryViewItem[]>;
  archiveStory(storyId: string, signal?: AbortSignal): Promise<void>;
  getArchive(signal?: AbortSignal): Promise<StoryArchiveItem[]>;
  createHighlight(
    title: string,
    coverUri: string,
    storyIds: string[],
    signal?: AbortSignal
  ): Promise<StoryHighlight>;
  getHighlights(userId: string, signal?: AbortSignal): Promise<StoryHighlight[]>;
  updateHighlight(
    highlightId: string,
    data: Partial<Pick<StoryHighlight, 'title' | 'coverUri' | 'storyIds'>>,
    signal?: AbortSignal
  ): Promise<StoryHighlight>;
  deleteHighlight(highlightId: string, signal?: AbortSignal): Promise<void>;
  muteStories(userId: string, signal?: AbortSignal): Promise<void>;
  unmuteStories(userId: string, signal?: AbortSignal): Promise<void>;
  reportStory(storyId: string, reason: string, signal?: AbortSignal): Promise<{ reported: boolean }>;
}
