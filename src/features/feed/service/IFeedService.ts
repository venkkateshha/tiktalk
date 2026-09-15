/**
 * TikTalk Feed Service Contract
 * Boundary for future backend feed endpoints, optimistic actions, and pagination
 */

import { FeedFilter, FeedPaginationResult } from '../types';

export interface IFeedService {
  getFeed(filter: FeedFilter, cursor?: string, signal?: AbortSignal): Promise<FeedPaginationResult>;
  likePost(postId: string, like: boolean): Promise<{ success: boolean; likeCount: number }>;
  savePost(postId: string, save: boolean): Promise<{ success: boolean; saveCount: number }>;
  followCreator(creatorId: string, follow: boolean): Promise<{ success: boolean }>;
  repostPost(postId: string, repost: boolean): Promise<{ success: boolean }>;
}
