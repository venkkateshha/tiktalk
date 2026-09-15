/**
 * TikTalk Phase 2: Feed Domain & State Types
 * Clean typed models for For You & Following vertical video feed
 * Backend-ready without fake business data
 */

import { User } from '../../domain/user';
import { MediaItem, AudioTrack } from '../../domain/media';
import { EngagementMetrics } from '../../domain/engagement';
import { PrivacyLevel, ContentStatus } from '../../domain/post';

export type FeedFilter = 'forYou' | 'following';

export interface FeedItemModel {
  id: string;
  creatorId: string;
  creator?: User;
  media: MediaItem;
  caption: string;
  hashtags: string[];
  audio?: AudioTrack;
  accessibilityDescription?: string;
  engagement: EngagementMetrics;
  privacy: PrivacyLevel;
  status: ContentStatus;
  allowDuet: boolean;
  allowComments: boolean;
  allowSharing: boolean;
  isLiked: boolean;
  isSaved: boolean;
  isFollowingCreator: boolean;
  isReposted: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface FeedPaginationResult {
  items: FeedItemModel[];
  nextCursor?: string;
  hasMore: boolean;
}

export type FeedStatus = 'idle' | 'loading' | 'success' | 'empty' | 'unavailable' | 'offline' | 'error';

export interface FeedState {
  filter: FeedFilter;
  items: FeedItemModel[];
  activeIndex: number;
  status: FeedStatus;
  errorMessage: string | null;
  isPlaying: boolean;
  isMuted: boolean;
  hasMore: boolean;
  nextCursor?: string;
}
