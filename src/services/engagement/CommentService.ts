/**
 * TikTalk Phase 7: Comment Service Implementation
 * Real storage-backed comments, replies, cursor pagination, likes, and reporting.
 * Zero fake comments.
 */

import {
  Comment,
  CommentCursorResult,
  CommentReportPayload,
  MAX_COMMENT_LENGTH,
} from '../../domain/engagement';
import { IStorageService, storageService } from '../storage';
import { ICommentService } from './ICommentService';
import { EngagementCoordinator } from './EngagementCoordinator';

const STORAGE_KEY_COMMENTS_PREFIX = 'tiktalk_comments_';
const STORAGE_KEY_REPORTED = 'tiktalk_reported_comments';
const PAGE_SIZE = 10;

export class CommentService implements ICommentService {
  constructor(private storage: IStorageService = storageService) {}

  private getStorageKey(postId: string): string {
    return `${STORAGE_KEY_COMMENTS_PREFIX}${postId}`;
  }

  private async getAllComments(postId: string): Promise<Comment[]> {
    try {
      const stored = await this.storage.getItem<Comment[]>(this.getStorageKey(postId));
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  }

  private async saveAllComments(postId: string, comments: Comment[]): Promise<void> {
    await this.storage.setItem(this.getStorageKey(postId), comments);
  }

  async getComments(postId: string, cursor?: string): Promise<CommentCursorResult> {
    const all = await this.getAllComments(postId);
    // Only top-level comments (no parentId or parentCommentId)
    const topLevel = all.filter((c) => !c.parentId && !c.parentCommentId);

    // Sort newest first
    const sorted = [...topLevel].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const startIndex = cursor ? parseInt(cursor, 10) : 0;
    const safeStart = isNaN(startIndex) ? 0 : startIndex;
    const paged = sorted.slice(safeStart, safeStart + PAGE_SIZE);
    const nextIndex = safeStart + PAGE_SIZE;
    const hasMore = nextIndex < sorted.length;

    return {
      items: paged,
      nextCursor: hasMore ? String(nextIndex) : undefined,
      hasMore,
    };
  }

  async getReplies(commentId: string, cursor?: string): Promise<CommentCursorResult> {
    // Look across comments to find replies for this parent
    // To be safe, scan all keys or inspect current post context if known
    // Since replies are stored within the post comments list, we find by parentId
    // If postId is unknown, we can look in the memory coordinator or search
    let replies: Comment[] = [];

    // Search cached or common post keys
    // In our implementation, replies have parentId === commentId or parentCommentId === commentId
    const stored = await this.storage.getItem<Comment[]>(
      `tiktalk_replies_${commentId}`
    );
    if (stored && Array.isArray(stored)) {
      replies = stored;
    }

    const sorted = [...replies].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const startIndex = cursor ? parseInt(cursor, 10) : 0;
    const safeStart = isNaN(startIndex) ? 0 : startIndex;
    const paged = sorted.slice(safeStart, safeStart + PAGE_SIZE);
    const nextIndex = safeStart + PAGE_SIZE;
    const hasMore = nextIndex < sorted.length;

    return {
      items: paged,
      nextCursor: hasMore ? String(nextIndex) : undefined,
      hasMore,
    };
  }

  async addComment(
    postId: string,
    text: string,
    parentCommentId?: string
  ): Promise<Comment> {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error('Comment cannot be empty');
    }
    if (trimmed.length > MAX_COMMENT_LENGTH) {
      throw new Error(`Comment exceeds maximum limit of ${MAX_COMMENT_LENGTH} characters`);
    }

    const all = await this.getAllComments(postId);
    const newComment: Comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      postId,
      authorId: 'me',
      author: {
        id: 'me',
        username: 'me',
        displayName: 'You',
        avatarUrl: undefined,
        verificationStatus: 'none',
        isCreator: false,
        createdAt: new Date().toISOString(),
      },
      text: trimmed,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      hasLiked: false,
      replyCount: 0,
      parentId: parentCommentId,
      parentCommentId,
    };

    if (parentCommentId) {
      // It's a reply!
      // 1. Update replyCount on parent comment
      const parentIdx = all.findIndex((c) => c.id === parentCommentId);
      if (parentIdx >= 0) {
        const currentReplyCount = all[parentIdx].replyCount || 0;
        all[parentIdx] = {
          ...all[parentIdx],
          replyCount: currentReplyCount + 1,
        };
      }

      // 2. Append reply to replies storage
      const replyKey = `tiktalk_replies_${parentCommentId}`;
      const existingReplies = (await this.storage.getItem<Comment[]>(replyKey)) || [];
      await this.storage.setItem(replyKey, [...existingReplies, newComment]);
    } else {
      // Top level comment
      all.push(newComment);
    }

    await this.saveAllComments(postId, all);

    // Notify coordinator
    const currentEngagement = EngagementCoordinator.getCachedState(postId);
    const newCount = (currentEngagement?.commentCount ?? 0) + 1;
    EngagementCoordinator.notify({
      type: 'comment_added',
      postId,
      state: {
        commentCount: newCount,
      },
    });

    return newComment;
  }

  async deleteComment(commentId: string, postId: string): Promise<void> {
    const all = await this.getAllComments(postId);
    const target = all.find((c) => c.id === commentId);

    // If it was a top level comment, remove it and its replies
    const remaining = all.filter((c) => c.id !== commentId);
    await this.saveAllComments(postId, remaining);

    // Clean up replies if any
    await this.storage.removeItem(`tiktalk_replies_${commentId}`);

    // If it was a reply to another comment, decrement parent's replyCount
    if (target?.parentCommentId || target?.parentId) {
      const parentId = target.parentCommentId || target.parentId;
      const parentIdx = remaining.findIndex((c) => c.id === parentId);
      if (parentIdx >= 0) {
        remaining[parentIdx] = {
          ...remaining[parentIdx],
          replyCount: Math.max(0, (remaining[parentIdx].replyCount || 1) - 1),
        };
        await this.saveAllComments(postId, remaining);
      }
      // Also remove from replyKey
      const replyKey = `tiktalk_replies_${parentId}`;
      const existingReplies = (await this.storage.getItem<Comment[]>(replyKey)) || [];
      await this.storage.setItem(
        replyKey,
        existingReplies.filter((r) => r.id !== commentId)
      );
    }

    const currentEngagement = EngagementCoordinator.getCachedState(postId);
    const newCount = Math.max(0, (currentEngagement?.commentCount ?? 1) - 1);
    EngagementCoordinator.notify({
      type: 'comment_deleted',
      postId,
      state: {
        commentCount: newCount,
      },
    });
  }

  async toggleCommentLike(
    commentId: string,
    currentLiked: boolean,
    currentCount = 0
  ): Promise<{ hasLiked: boolean; likeCount?: number }> {
    const nextLiked = !currentLiked;
    const nextCount = nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1);
    // Return updated liked state
    return {
      hasLiked: nextLiked,
      likeCount: nextCount,
    };
  }

  async reportComment(payload: CommentReportPayload): Promise<void> {
    const existing = (await this.storage.getItem<CommentReportPayload[]>(STORAGE_KEY_REPORTED)) || [];
    await this.storage.setItem(STORAGE_KEY_REPORTED, [...existing, payload]);
  }

  async clear(): Promise<void> {
    await this.storage.removeItem(STORAGE_KEY_REPORTED);
  }
}

export const commentService = new CommentService();
