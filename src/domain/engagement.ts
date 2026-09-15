/**
 * TikTalk Domain: Social Engagements & Comments
 */

import { User } from './user';

export interface EngagementMetrics {
  likeCount: number;
  commentCount: number;
  shareCount: number;
  bookmarkCount: number;
  viewCount: number;
  hasLiked: boolean;
  hasBookmarked: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author?: User;
  text: string;
  createdAt: string;
  likeCount: number;
  hasLiked: boolean;
  replyCount: number;
  parentId?: string;
}

export interface SharePayload {
  postId: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
}
