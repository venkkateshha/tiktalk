/**
 * TikTalk Service Boundary: Baseline Recommendation Service Implementation
 */

import { IRecommendationService, UserEngagementSignal } from './IRecommendationService';
import { FeedItem, FeedType } from '../../domain/post';
import { IApiClient, apiClient } from '../api';

export class RecommendationService implements IRecommendationService {
  private client: IApiClient;

  constructor(client: IApiClient = apiClient) {
    this.client = client;
  }

  async getFeedRecommendations(
    feedType: FeedType,
    cursor?: string,
    limit: number = 10
  ): Promise<{ items: FeedItem[]; nextCursor?: string }> {
    const res = await this.client.get<{ items: FeedItem[]; nextCursor?: string }>('/recommendations/feed', {
      params: { feedType, cursor: cursor || '', limit },
    });
    return res.data;
  }

  async recordEngagementSignal(signal: UserEngagementSignal): Promise<void> {
    await this.client.post('/recommendations/signals', signal);
  }

  async resetColdStartVector(): Promise<void> {
    await this.client.post('/recommendations/reset-profile');
  }
}

export const recommendationService: IRecommendationService = new RecommendationService();
