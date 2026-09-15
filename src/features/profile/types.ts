/**
 * TikTalk Phase 5: Profile & Follow System Domain Models
 * Clean contracts for profiles, public/private accounts, verification,
 * follower/following relationships, and responsive content grids.
 * Zero fake business data — strictly backend-ready.
 */

export type VerificationBadgeStatus = 'none' | 'pending' | 'verified' | 'rejected';

export type FollowState = 'none' | 'following' | 'requested';

export type ProfileTab = 'videos' | 'liked' | 'saved';

export type ProfileStatus =
  | 'loading'
  | 'success'
  | 'empty'
  | 'private_locked'
  | 'offline'
  | 'unavailable'
  | 'error';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  website?: string;
  isPrivate: boolean;
  isCreator: boolean;
  verificationStatus: VerificationBadgeStatus;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  likesCount: number;
  followState: FollowState;
  createdAt: string;
  creatorTier?: 'emerging' | 'partner' | 'elite';
  category?: string;
}

export interface EditProfileInput {
  displayName: string;
  username: string;
  bio: string;
  website: string;
  avatarUri?: string;
}

export interface ProfileValidationResult {
  isValid: boolean;
  errors: {
    displayName?: string;
    username?: string;
    bio?: string;
    website?: string;
  };
}

export interface FollowUserSummary {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isVerified: boolean;
  followState: FollowState;
  isCreator?: boolean;
}

export interface ProfileVideoItem {
  id: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  caption?: string;
  viewCount: number;
  likeCount: number;
  durationSeconds?: number;
  createdAt: string;
}

export interface FollowEvent {
  userId: string;
  followState: FollowState;
  deltaFollowersCount: number;
}
