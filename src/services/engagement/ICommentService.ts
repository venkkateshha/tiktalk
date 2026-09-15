/**
 * TikTalk Phase 7: Comment Service Contract
 * Cursor-paginated top-level comments, nested replies, optimistic creations, reporting
 */

import {
  Comment,
  CommentCursorResult,
  CommentReportPayload,
} from '../../domain/engagement';

export interface ICommentService {
  /**
   * Fetch top-level comments for a post with cursor-based pagination.
   */
  getComments(postId: string, cursor?: string): Promise<CommentCursorResult>;

  /**
   * Fetch replies for a specific top-level comment.
   */
  getReplies(commentId: string, cursor?: string): Promise<CommentCursorResult>;

  /**
   * Post a new comment or reply.
   */
  addComment(
    postId: string,
    text: string,
    parentCommentId?: string
  ): Promise<Comment>;

  /**
   * Delete an existing comment (author only).
   */
  deleteComment(commentId: string, postId: string): Promise<void>;

  /**
   * Toggle like state on a comment.
   */
  toggleCommentLike(
    commentId: string,
    currentLiked: boolean,
    currentCount?: number
  ): Promise<{ hasLiked: boolean; likeCount?: number }>;

  /**
   * Submit a moderation report for a comment.
   */
  reportComment(payload: CommentReportPayload): Promise<void>;

  /**
   * Clear local comment storage (for test runs).
   */
  clear(): Promise<void>;
}
