/**
 * TikTalk Domain: User & Identity
 * Clean domain contracts for user profiles, creator tiers, and relationships
 */

export type VerificationStatus = 'none' | 'pending' | 'verified' | 'partner';

export interface User {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  verificationStatus: VerificationStatus;
  isCreator: boolean;
  createdAt: string;
}

export interface CreatorProfile extends User {
  isCreator: true;
  category?: string;
  subscriberCount: number;
  totalVideoViews: number;
  totalLikesReceived: number;
  payoutEligible: boolean;
  revenueSharePercent: number; // 60% locked creator economics
}

export interface UserRelationship {
  targetUserId: string;
  isFollowing: boolean;
  isFollowedBy: boolean;
  isMuted: boolean;
  isBlocked: boolean;
}
