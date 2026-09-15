/**
 * TikTalk Service Boundary: Recommendation & AI Ranking Contract
 */

import { FeedItem, FeedType } from '../../domain/post';

export interface UserEngagementSignal {
  postId: string;
  creatorId: string;
  signalType: 'watch_progress' | 'completion' | 'loop' | 'like' | 'share' | 'comment' | 'skip';
  watchTimeSeconds: number;
  totalDurationSeconds: number;
  timestamp: number;
}

export interface IRecommendationService {
  getFeedRecommendations(feedType: FeedType, cursor?: string, limit?: number): Promise<{ items: FeedItem[]; nextCursor?: string }>;
  recordEngagementSignal(signal: UserEngagementSignal): Promise<void>;
  resetColdStartVector(): Promise<void>;
}
