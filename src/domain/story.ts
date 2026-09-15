/**
 * TikTalk Domain: Unified Stories & Status System
 * Production-grade domain models for ephemeral 24h stories, status updates, highlights, and archive
 * Zero fake business data — domain invariants strictly enforced
 */

import { MediaAsset } from '../features/create/types';

export type StoryType = 'photo' | 'video' | 'text';

export type StoryAudience = 'everyone' | 'followers' | 'close_friends' | 'custom';

export type StoryReactionType = 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';

export interface StoryMedia {
  id: string;
  uri: string;
  mimeType: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  thumbnailUri?: string;
  isMuted?: boolean;
}

export interface StoryTextOverlay {
  id: string;
  text: string;
  style: 'classic' | 'neon' | 'bold' | 'minimal' | 'typewriter';
  color: string;
  backgroundColor?: string;
  fontSize: number;
  position: { x: number; y: number }; // Relative percentage (0 - 100)
}

export interface StoryStickerOverlay {
  id: string;
  type: 'emoji' | 'mention' | 'location' | 'poll';
  value: string;
  position: { x: number; y: number };
}

export interface StoryDrawingPath {
  id: string;
  color: string;
  strokeWidth: number;
  points: { x: number; y: number }[];
}

export interface Story {
  id: string;
  creatorId: string;
  creatorUsername: string;
  creatorDisplayName: string;
  creatorAvatarUrl?: string;
  isVerified?: boolean;
  type: StoryType;
  media?: StoryMedia;
  textContent?: string;
  textBackground?: string; // Hex color or gradient token
  overlays?: StoryTextOverlay[];
  stickers?: StoryStickerOverlay[];
  drawings?: StoryDrawingPath[];
  mentions: string[];
  audience: StoryAudience;
  customAllowedUserIds?: string[];
  hiddenFromUserIds?: string[];
  createdAt: string; // ISO 8601
  expiresAt: string; // ISO 8601, default exactly 24 hours after createdAt
  durationSeconds: number; // e.g. 5 for photo/text, or video length
  isArchived?: boolean;
  viewCount: number;
  hasViewed?: boolean;
  myReaction?: StoryReactionType;
  reactionsSummary?: Partial<Record<StoryReactionType, number>>;
}

export interface StoryUserGroup {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isVerified?: boolean;
  stories: Story[];
  hasUnseenStories: boolean;
  latestStoryTimestamp: string;
  isMuted?: boolean;
}

export interface StoryViewItem {
  storyId: string;
  viewerId: string;
  viewerUsername: string;
  viewerDisplayName: string;
  viewerAvatarUrl?: string;
  viewedAt: string;
  reaction?: StoryReactionType;
}

export interface StoryReplyItem {
  id: string;
  storyId: string;
  senderId: string;
  senderUsername: string;
  recipientId: string;
  text: string;
  reaction?: StoryReactionType;
  createdAt: string;
}

export interface StoryHighlight {
  id: string;
  userId: string;
  title: string;
  coverUri: string;
  storyIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StoryArchiveItem {
  id: string;
  story: Story;
  archivedAt: string;
}

export interface CreateStoryInput {
  type: StoryType;
  media?: MediaAsset;
  textContent?: string;
  textBackground?: string;
  overlays?: StoryTextOverlay[];
  stickers?: StoryStickerOverlay[];
  drawings?: StoryDrawingPath[];
  mentions?: string[];
  audience: StoryAudience;
  customAllowedUserIds?: string[];
  hiddenFromUserIds?: string[];
  durationSeconds?: number;
}

/**
 * Story Lifetime Constant: Exactly 24 hours in milliseconds
 */
export const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000;

/**
 * Calculates story expiry timestamp from a given creation timestamp (default 24h)
 */
export function calculateStoryExpiry(createdAtIso: string = new Date().toISOString()): string {
  const createdTime = new Date(createdAtIso).getTime();
  const expiryTime = createdTime + STORY_LIFETIME_MS;
  return new Date(expiryTime).toISOString();
}

/**
 * Domain check: determines if a story has expired based on current time
 */
export function isStoryExpired(story: Pick<Story, 'expiresAt'>, nowMs: number = Date.now()): boolean {
  return nowMs >= new Date(story.expiresAt).getTime();
}
