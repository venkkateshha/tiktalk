import { User } from './user';

export const MAX_COMMENT_LENGTH = 300;

export interface EngagementMetrics {
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  bookmarkCount?: number;
  viewCount?: number;
  repostCount?: number;
  hasLiked?: boolean;
  hasBookmarked?: boolean;
  hasReposted?: boolean;
}

export interface PostEngagementState {
  postId: string;
  hasLiked: boolean;
  likeCount?: number;
  hasBookmarked: boolean;
  bookmarkCount?: number;
  hasReposted: boolean;
  repostCount?: number;
  commentCount?: number;
  shareCount?: number;
  viewCount?: number;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author?: User;
  text: string;
  createdAt: string;
  likeCount?: number;
  hasLiked?: boolean;
  replyCount?: number;
  parentId?: string;
  parentCommentId?: string;
}

export interface CommentCursorResult {
  items: Comment[];
  nextCursor?: string;
  hasMore: boolean;
}

export type CommentReportReason =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'sexual_content'
  | 'violence'
  | 'scam'
  | 'other';

export interface CommentReportPayload {
  commentId: string;
  postId: string;
  reason: CommentReportReason;
  notes?: string;
  reportedAt: string;
}

export interface SharePayload {
  postId: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
}
