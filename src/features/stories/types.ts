/**
 * TikTalk Phase 6: Stories Feature Types & UI State Contracts
 */

import {
  Story,
  StoryUserGroup,
  StoryType,
  StoryAudience,
  StoryReactionType,
  StoryViewItem,
  StoryReplyItem,
  StoryHighlight,
  StoryArchiveItem,
  CreateStoryInput,
} from '../../domain/story';

export * from '../../domain/story';

export type StoryViewerStatus = 'loading' | 'playing' | 'paused' | 'buffering' | 'ended' | 'error';

export interface StoryViewerState {
  currentUserGroupIndex: number;
  currentStoryIndex: number;
  status: StoryViewerStatus;
  progress: number; // 0.0 to 1.0
  isMuted: boolean;
  activeReaction?: StoryReactionType;
  errorMessage?: string;
}

export type StoryCreationStep = 'media_select' | 'edit' | 'audience' | 'publishing';

export interface StoryCreationDraft {
  type: StoryType;
  mediaUri?: string;
  mediaMimeType?: string;
  textContent: string;
  textBackground: string;
  textStyle: 'classic' | 'neon' | 'bold' | 'minimal' | 'typewriter';
  textColor: string;
  audience: StoryAudience;
  isMuted: boolean;
  mentions: string[];
}

export interface StoryViewersSheetState {
  isOpen: boolean;
  storyId: string;
  viewers: StoryViewItem[];
  totalViews: number;
  isLoading: boolean;
}
