/**
 * TikTalk Shared Domain Types
 * Strict typing for Actors, Content, Ledger, Metrics, and System States
 */

export type NavigationTab = 'Home' | 'Discover' | 'Create' | 'Inbox' | 'Profile';
export type FeedType = 'forYou' | 'following';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  isVerified: boolean;
  followerCount: number;
  followingCount: number;
  totalLikes: number;
  createdAt: string;
}

export interface VideoMetadata {
  id: string;
  creatorId: string;
  caption: string;
  videoUrl: string;
  thumbnailUrl?: string;
  audioId: string;
  audioTitle: string;
  audioArtist: string;
  durationSeconds: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  bookmarkCount: number;
  createdAt: string;
}

export type ContentStatus = 
  | 'draft' 
  | 'uploading' 
  | 'processing' 
  | 'ready' 
  | 'published' 
  | 'restricted' 
  | 'removed';

export interface CreatorLedgerSummary {
  creatorId: string;
  pendingBalance: number;
  clearedBalance: number;
  revSharePercentage: 60;
  nextPayoutDate: string; // Every Monday 10:00 AM IST
  currency: string;
  upiId?: string;
}

export interface SystemStatus {
  phase: 'Phase 0 — Foundation';
  version: string;
  environment: 'development' | 'staging' | 'production';
  newArchitectureEnabled: boolean;
  webResponsiveSupported: boolean;
}
