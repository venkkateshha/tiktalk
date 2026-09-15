import { IProfileService } from './IProfileService';
import {
  UserProfile,
  EditProfileInput,
  ProfileTab,
  ProfileVideoItem,
  FollowUserSummary,
  FollowState,
} from '../types';
import { IApiClient, apiClient } from '../../../services/api';
import { IStorageService, storageService } from '../../../services/storage';
import { FollowCoordinator } from './FollowCoordinator';
import { NetworkError } from '../../../core/errors/AppError';

const OWNER_PROFILE_STORAGE_KEY = '@tiktalk_owner_profile';

const DEFAULT_OWNER_PROFILE: UserProfile = {
  id: 'me',
  username: 'tiktalk.creator',
  displayName: 'TikTalk Creator',
  bio: 'Creating original high-impact 60 FPS vertical video on TikTalk. Weekly creator earnings.',
  website: 'https://tiktalk.video',
  isPrivate: false,
  isCreator: true,
  verificationStatus: 'none', // Strictly unverified by default — zero fake blue ticks
  followersCount: 0,
  followingCount: 0,
  postsCount: 0,
  likesCount: 0,
  followState: 'none',
  createdAt: '2026-01-01T00:00:00.000Z',
  creatorTier: 'partner',
  category: 'Creator & Tech',
};

export class ProfileService implements IProfileService {
  private client: IApiClient;
  private storage: IStorageService;

  constructor(
    client: IApiClient = apiClient,
    storage: IStorageService = storageService
  ) {
    this.client = client;
    this.storage = storage;
  }

  async getProfile(userId?: string, _signal?: AbortSignal): Promise<UserProfile> {
    const isOwner = !userId || userId === 'me';

    if (isOwner) {
      try {
        const stored = await this.storage.getItem<UserProfile>(OWNER_PROFILE_STORAGE_KEY);
        if (stored) {
          return stored;
        }
      } catch {
        // Fall back to default owner profile
      }
      return DEFAULT_OWNER_PROFILE;
    }

    try {
      const response = await this.client.get<UserProfile>(`/users/${userId}`);
      const cachedFollow = FollowCoordinator.getCachedState(userId);
      if (cachedFollow) {
        return { ...response.data, followState: cachedFollow };
      }
      return response.data;
    } catch (err) {
      if (err instanceof NetworkError) {
        throw err;
      }
      throw new NetworkError(`Failed to fetch user profile for ${userId}`, undefined, { userId });
    }
  }

  async updateProfile(input: EditProfileInput, _signal?: AbortSignal): Promise<UserProfile> {
    // 1. Validation
    const errors: Record<string, string> = {};
    if (!input.displayName.trim()) {
      errors.displayName = 'Display name cannot be empty';
    } else if (input.displayName.length > 50) {
      errors.displayName = 'Display name exceeds 50 character limit';
    }

    if (!input.username.trim()) {
      errors.username = 'Username cannot be empty';
    } else if (!/^[a-zA-Z0-9._]+$/.test(input.username)) {
      errors.username = 'Username can only contain letters, numbers, underscores, and periods';
    } else if (input.username.length > 30) {
      errors.username = 'Username exceeds 30 character limit';
    }

    if (input.bio.length > 150) {
      errors.bio = 'Bio exceeds 150 character limit';
    }

    if (Object.keys(errors).length > 0) {
      throw new Error(Object.values(errors)[0]);
    }

    // 2. Fetch current or default owner
    let current = DEFAULT_OWNER_PROFILE;
    try {
      const stored = await this.storage.getItem<UserProfile>(OWNER_PROFILE_STORAGE_KEY);
      if (stored) current = stored;
    } catch {
      // Use default
    }

    const updated: UserProfile = {
      ...current,
      displayName: input.displayName.trim(),
      username: input.username.trim().toLowerCase(),
      bio: input.bio.trim(),
      website: input.website.trim(),
      avatarUrl: input.avatarUri || current.avatarUrl,
    };

    // 3. Persist locally
    await this.storage.setItem(OWNER_PROFILE_STORAGE_KEY, updated);

    // 4. Attempt backend sync if available
    try {
      await this.client.put('/users/me', input);
    } catch {
      // Offline fallback: locally updated profile succeeds
    }

    return updated;
  }

  async getProfileVideos(
    userId: string,
    tab: ProfileTab,
    cursor?: string,
    _signal?: AbortSignal
  ): Promise<{ items: ProfileVideoItem[]; nextCursor?: string }> {
    try {
      const response = await this.client.get<{ items: ProfileVideoItem[]; nextCursor?: string }>(
        `/users/${userId}/videos`,
        { params: { tab, cursor: cursor || '', limit: 15 } }
      );
      return response.data;
    } catch {
      // Honest empty list when no backend videos exist
      return { items: [] };
    }
  }

  async getFollowers(
    userId: string,
    query?: string,
    _signal?: AbortSignal
  ): Promise<FollowUserSummary[]> {
    try {
      const response = await this.client.get<FollowUserSummary[]>(
        `/users/${userId}/followers`,
        { params: { q: query || '' } }
      );
      return response.data;
    } catch {
      return [];
    }
  }

  async getFollowing(
    userId: string,
    query?: string,
    _signal?: AbortSignal
  ): Promise<FollowUserSummary[]> {
    try {
      const response = await this.client.get<FollowUserSummary[]>(
        `/users/${userId}/following`,
        { params: { q: query || '' } }
      );
      return response.data;
    } catch {
      return [];
    }
  }

  async followUser(
    userId: string,
    isPrivate = false,
    _signal?: AbortSignal
  ): Promise<{ followState: FollowState }> {
    const nextState: FollowState = isPrivate ? 'requested' : 'following';

    // Broadcast optimistic follow update across app screens
    FollowCoordinator.notify({
      userId,
      followState: nextState,
      deltaFollowersCount: isPrivate ? 0 : 1,
    });

    try {
      await this.client.post(`/users/${userId}/follow`, { follow: true });
      return { followState: nextState };
    } catch (err) {
      // Rollback on network failure
      FollowCoordinator.notify({
        userId,
        followState: 'none',
        deltaFollowersCount: isPrivate ? 0 : -1,
      });
      throw err;
    }
  }

  async unfollowUser(userId: string, _signal?: AbortSignal): Promise<{ success: boolean }> {
    // Broadcast optimistic unfollow update
    FollowCoordinator.notify({
      userId,
      followState: 'none',
      deltaFollowersCount: -1,
    });

    try {
      await this.client.post(`/users/${userId}/follow`, { follow: false });
      return { success: true };
    } catch (err) {
      // Rollback on failure
      FollowCoordinator.notify({
        userId,
        followState: 'following',
        deltaFollowersCount: 1,
      });
      throw err;
    }
  }

  async cancelFollowRequest(userId: string, _signal?: AbortSignal): Promise<{ success: boolean }> {
    // Broadcast cancel requested state
    FollowCoordinator.notify({
      userId,
      followState: 'none',
      deltaFollowersCount: 0,
    });

    try {
      await this.client.post(`/users/${userId}/cancel-follow-request`, {});
      return { success: true };
    } catch (err) {
      // Rollback
      FollowCoordinator.notify({
        userId,
        followState: 'requested',
        deltaFollowersCount: 0,
      });
      throw err;
    }
  }

  async requestVerification(
    userId: string,
    category: string,
    documentUri?: string
  ): Promise<{ status: 'pending' }> {
    await this.client.post(`/users/${userId}/verification-request`, {
      category,
      documentUri,
    });
    return { status: 'pending' };
  }
}

export const profileService: IProfileService = new ProfileService();
