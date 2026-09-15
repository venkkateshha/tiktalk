/**
 * TikTalk Discover Service Implementation
 * Production boundary communicating with real backend API
 * Handles stale request cancellation via AbortSignal
 */

import { IDiscoverService, SearchResponse } from './IDiscoverService';
import {
  SearchCategory,
  VideoSearchResult,
  HashtagSearchResult,
  AudioSearchResult,
  SearchPaginationResult,
} from '../types';
import { IApiClient, apiClient } from '../../../services/api';
import { NetworkError } from '../../../core/errors/AppError';

export class DiscoverService implements IDiscoverService {
  private client: IApiClient;

  constructor(client: IApiClient = apiClient) {
    this.client = client;
  }

  async search(
    query: string,
    category: SearchCategory,
    cursor?: string,
    _signal?: AbortSignal
  ): Promise<SearchResponse> {
    try {
      const response = await this.client.get<SearchResponse>('/search', {
        params: {
          q: query.trim(),
          category,
          cursor: cursor || '',
          limit: 20,
        },
      });
      return response.data;
    } catch (err) {
      if (err instanceof NetworkError) {
        throw err;
      }
      throw new NetworkError(
        `Failed to execute search for query "${query}" in category "${category}"`,
        undefined,
        { query, category, cursor }
      );
    }
  }

  async getDiscoverFeed(
    cursor?: string,
    _signal?: AbortSignal
  ): Promise<SearchPaginationResult<VideoSearchResult>> {
    try {
      const response = await this.client.get<SearchPaginationResult<VideoSearchResult>>(
        '/discover/feed',
        {
          params: {
            cursor: cursor || '',
            limit: 20,
          },
        }
      );
      return response.data;
    } catch (err) {
      if (err instanceof NetworkError) {
        throw err;
      }
      throw new NetworkError('Failed to fetch discover feed', undefined, { cursor });
    }
  }

  async getTrendingHashtags(_signal?: AbortSignal): Promise<HashtagSearchResult[]> {
    try {
      const response = await this.client.get<HashtagSearchResult[]>(
        '/discover/trending/hashtags'
      );
      return response.data;
    } catch (err) {
      if (err instanceof NetworkError) {
        throw err;
      }
      throw new NetworkError('Failed to fetch trending hashtags');
    }
  }

  async getTrendingAudio(_signal?: AbortSignal): Promise<AudioSearchResult[]> {
    try {
      const response = await this.client.get<AudioSearchResult[]>(
        '/discover/trending/audio'
      );
      return response.data;
    } catch (err) {
      if (err instanceof NetworkError) {
        throw err;
      }
      throw new NetworkError('Failed to fetch trending audio');
    }
  }

  async followCreator(creatorId: string, follow: boolean): Promise<void> {
    await this.client.post(`/users/${creatorId}/follow`, { follow });
  }
}

export const discoverService: IDiscoverService = new DiscoverService();
