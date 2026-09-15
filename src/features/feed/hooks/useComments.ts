/**
 * TikTalk Phase 7: useComments Hook
 * Manages cursor-based comment feed, nested replies, optimistic additions/deletions,
 * likes on comments, and reporting dialog state.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Comment,
  CommentReportReason,
  MAX_COMMENT_LENGTH,
} from '../../../domain/engagement';
import {
  ICommentService,
  commentService,
  EngagementCoordinator,
} from '../../../services/engagement';

export interface UseCommentsProps {
  postId: string;
  service?: ICommentService;
}

export interface UseCommentsReturn {
  comments: Comment[];
  isLoading: boolean;
  isSubmitting: boolean;
  hasMore: boolean;
  repliesMap: Record<string, Comment[]>;
  expandedReplies: Set<string>;
  replyingTo: Comment | null;
  loadComments: (cursor?: string, append?: boolean) => Promise<void>;
  loadReplies: (commentId: string) => Promise<void>;
  toggleExpandReplies: (commentId: string) => void;
  setReplyingTo: (comment: Comment | null) => void;
  addComment: (text: string) => Promise<Comment | null>;
  deleteComment: (commentId: string) => Promise<void>;
  toggleCommentLike: (commentId: string) => Promise<void>;
  reportComment: (
    commentId: string,
    reason: CommentReportReason,
    notes?: string
  ) => Promise<void>;
}

export function useComments({
  postId,
  service = commentService,
}: UseCommentsProps): UseCommentsReturn {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [repliesMap, setRepliesMap] = useState<Record<string, Comment[]>>({});
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  const loadComments = useCallback(
    async (cursor?: string, append = false) => {
      if (!append) setIsLoading(true);
      try {
        const result = await service.getComments(postId, cursor);
        setComments((prev) => (append ? [...prev, ...result.items] : result.items));
        setHasMore(result.hasMore);
        setNextCursor(result.nextCursor);
      } catch {
        // Safe fallback
      } finally {
        setIsLoading(false);
      }
    },
    [postId, service]
  );

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const loadReplies = useCallback(
    async (commentId: string) => {
      try {
        const result = await service.getReplies(commentId);
        setRepliesMap((prev) => ({
          ...prev,
          [commentId]: result.items,
        }));
      } catch {
        // Safe fallback
      }
    },
    [service]
  );

  const toggleExpandReplies = useCallback(
    (commentId: string) => {
      setExpandedReplies((prev) => {
        const next = new Set(prev);
        if (next.has(commentId)) {
          next.delete(commentId);
        } else {
          next.add(commentId);
          loadReplies(commentId);
        }
        return next;
      });
    },
    [loadReplies]
  );

  const addComment = useCallback(
    async (text: string): Promise<Comment | null> => {
      const trimmed = text.trim();
      if (!trimmed || trimmed.length > MAX_COMMENT_LENGTH || isSubmitting) {
        return null;
      }

      setIsSubmitting(true);
      try {
        const parentId = replyingTo?.id;
        const newComment = await service.addComment(postId, trimmed, parentId);

        if (parentId) {
          // If it was a reply, update replies list for parent
          setRepliesMap((prev) => ({
            ...prev,
            [parentId]: [...(prev[parentId] || []), newComment],
          }));
          // Automatically ensure parent replies are expanded
          setExpandedReplies((prev) => new Set(prev).add(parentId));

          // Increment replyCount on parent in main comment list
          setComments((prev) =>
            prev.map((c) =>
              c.id === parentId
                ? { ...c, replyCount: (c.replyCount || 0) + 1 }
                : c
            )
          );
        } else {
          // Top-level comment
          setComments((prev) => [newComment, ...prev]);
        }

        setReplyingTo(null);
        return newComment;
      } catch {
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, postId, replyingTo, service]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      try {
        await service.deleteComment(commentId, postId);
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        // Also remove if in repliesMap
        setRepliesMap((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((parentKey) => {
            next[parentKey] = next[parentKey].filter((r) => r.id !== commentId);
          });
          return next;
        });
      } catch {
        // Safe deletion
      }
    },
    [postId, service]
  );

  const toggleCommentLike = useCallback(
    async (commentId: string) => {
      // Find comment in top-level or replies
      let target = comments.find((c) => c.id === commentId);
      let isReply = false;
      let parentKey: string | undefined;

      if (!target) {
        for (const [pk, list] of Object.entries(repliesMap)) {
          const found = list.find((r) => r.id === commentId);
          if (found) {
            target = found;
            isReply = true;
            parentKey = pk;
            break;
          }
        }
      }

      if (!target) return;

      const currentLiked = target.hasLiked || false;
      const currentCount = target.likeCount || 0;

      // Optimistic update
      const nextLiked = !currentLiked;
      const nextCount = nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

      if (isReply && parentKey) {
        setRepliesMap((prev) => ({
          ...prev,
          [parentKey!]: prev[parentKey!].map((r) =>
            r.id === commentId
              ? { ...r, hasLiked: nextLiked, likeCount: nextCount }
              : r
          ),
        }));
      } else {
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? { ...c, hasLiked: nextLiked, likeCount: nextCount }
              : c
          )
        );
      }

      try {
        await service.toggleCommentLike(commentId, currentLiked, currentCount);
      } catch {
        // Revert on error
        if (isReply && parentKey) {
          setRepliesMap((prev) => ({
            ...prev,
            [parentKey!]: prev[parentKey!].map((r) =>
              r.id === commentId
                ? { ...r, hasLiked: currentLiked, likeCount: currentCount }
                : r
            ),
          }));
        } else {
          setComments((prev) =>
            prev.map((c) =>
              c.id === commentId
                ? { ...c, hasLiked: currentLiked, likeCount: currentCount }
                : c
            )
          );
        }
      }
    },
    [comments, repliesMap, service]
  );

  const reportComment = useCallback(
    async (commentId: string, reason: CommentReportReason, notes?: string) => {
      await service.reportComment({
        commentId,
        postId,
        reason,
        notes,
        reportedAt: new Date().toISOString(),
      });
    },
    [postId, service]
  );

  return {
    comments,
    isLoading,
    isSubmitting,
    hasMore,
    repliesMap,
    expandedReplies,
    replyingTo,
    loadComments,
    loadReplies,
    toggleExpandReplies,
    setReplyingTo,
    addComment,
    deleteComment,
    toggleCommentLike,
    reportComment,
  };
}
