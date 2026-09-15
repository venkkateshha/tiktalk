/**
 * TikTalk Domain: Posts, Feeds & Stories
 * Pure domain interfaces without fake business data
 */

import { User } from './user';
import { MediaItem, AudioTrack } from './media';
import { EngagementMetrics } from './engagement';

export type FeedType = 'forYou' | 'following' | 'friends' | 'trending';

export type ContentStatus =
  | 'draft'
  | 'uploading'
  | 'processing'
  | 'published'
  | 'under_review'
  | 'restricted'
  | 'removed';

export type PrivacyLevel = 'public' | 'friends_only' | 'private';

export interface BaseContent {
  id: string;
  creatorId: string;
  creator?: User;
  createdAt: string;
  updatedAt?: string;
  privacy: PrivacyLevel;
  status: ContentStatus;
}

export interface VideoPost extends BaseContent {
  type: 'video';
  caption: string;
  tags: string[];
  media: MediaItem;
  audio?: AudioTrack;
  engagement: EngagementMetrics;
  allowDuet: boolean;
  allowComments: boolean;
  allowSharing: boolean;
}

/**
 * StoryItem represents 24-hour ephemeral stories.
 * Accessible from Home feed top rail and Profile avatar.
 * Must NOT be placed in the bottom navigation.
 */
export interface StoryItem extends BaseContent {
  type: 'story';
  mediaUrl: string;
  thumbnailUrl?: string;
  durationSeconds: number;
  expiresAt: string;
  viewCount: number;
  hasViewed: boolean;
}

export type FeedItem = VideoPost;
