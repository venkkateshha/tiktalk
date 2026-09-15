/**
 * TikTalk Feed Service Implementation
 * Production boundary communicating with real backend API
 * Handles stale request cancellation via AbortSignal
 */

import { IFeedService } from './IFeedService';
import { FeedFilter, FeedPaginationResult } from '../types';
import { IApiClient, apiClient } from '../../../services/api';
import { NetworkError } from '../../../core/errors/AppError';

export class FeedService implements IFeedService {
  private client: IApiClient;

  constructor(client: IApiClient = apiClient) {
    this.client = client;
  }

  async getFeed(
    filter: FeedFilter,
    cursor?: string,
    _signal?: AbortSignal
  ): Promise<FeedPaginationResult> {
    try {
      const endpoint = filter === 'forYou' ? '/feed/for-you' : '/feed/following';
      const response = await this.client.get<FeedPaginationResult>(endpoint, {
        params: {
          cursor: cursor || '',
          limit: 10,
        },
      });
      return response.data;
    } catch (err) {
      if (err instanceof NetworkError) {
        throw err;
      }
      throw new NetworkError(
        `Failed to fetch ${filter === 'forYou' ? 'For You' : 'Following'} feed`,
        undefined,
        { filter, cursor }
      );
    }
  }

  async likePost(postId: string, like: boolean): Promise<{ success: boolean; likeCount: number }> {
    const response = await this.client.post<{ success: boolean; likeCount: number }>(
      `/feed/posts/${postId}/like`,
      { like }
    );
    return response.data;
  }

  async savePost(postId: string, save: boolean): Promise<{ success: boolean; saveCount: number }> {
    const response = await this.client.post<{ success: boolean; saveCount: number }>(
      `/feed/posts/${postId}/save`,
      { save }
    );
    return response.data;
  }

  async followCreator(creatorId: string, follow: boolean): Promise<{ success: boolean }> {
    const response = await this.client.post<{ success: boolean }>(
      `/users/${creatorId}/follow`,
      { follow }
    );
    return response.data;
  }

  async repostPost(postId: string, repost: boolean): Promise<{ success: boolean }> {
    const response = await this.client.post<{ success: boolean }>(
      `/feed/posts/${postId}/repost`,
      { repost }
    );
    return response.data;
  }
}

export const feedService: IFeedService = new FeedService();
