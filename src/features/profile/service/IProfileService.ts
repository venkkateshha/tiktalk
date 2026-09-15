import {
  UserProfile,
  EditProfileInput,
  ProfileTab,
  ProfileVideoItem,
  FollowUserSummary,
  FollowState,
} from '../types';

export interface IProfileService {
  getProfile(userId?: string, signal?: AbortSignal): Promise<UserProfile>;
  updateProfile(input: EditProfileInput, signal?: AbortSignal): Promise<UserProfile>;
  getProfileVideos(
    userId: string,
    tab: ProfileTab,
    cursor?: string,
    signal?: AbortSignal
  ): Promise<{ items: ProfileVideoItem[]; nextCursor?: string }>;
  getFollowers(
    userId: string,
    query?: string,
    signal?: AbortSignal
  ): Promise<FollowUserSummary[]>;
  getFollowing(
    userId: string,
    query?: string,
    signal?: AbortSignal
  ): Promise<FollowUserSummary[]>;
  followUser(
    userId: string,
    isPrivate?: boolean,
    signal?: AbortSignal
  ): Promise<{ followState: FollowState }>;
  unfollowUser(userId: string, signal?: AbortSignal): Promise<{ success: boolean }>;
  cancelFollowRequest(userId: string, signal?: AbortSignal): Promise<{ success: boolean }>;
  requestVerification(
    userId: string,
    category: string,
    documentUri?: string
  ): Promise<{ status: 'pending' }>;
}
