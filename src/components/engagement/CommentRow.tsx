/**
 * TikTalk Phase 7: CommentRow Component
 * Renders individual top-level comments and nested replies.
 * Includes like button, reply trigger, delete option for author, report dialog trigger,
 * and collapsible replies container.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Comment } from '../../domain/engagement';
import { useTheme } from '../../theme';
import { BrandColors } from '../../theme/colors';
import { Avatar } from '../ui/Avatar';
import { A11yStandards } from '../../core/a11y/a11yStandards';

export interface CommentRowProps {
  comment: Comment;
  isReply?: boolean;
  replies?: Comment[];
  isRepliesExpanded?: boolean;
  onToggleExpandReplies?: (commentId: string) => void;
  onReplyPress?: (comment: Comment) => void;
  onLikePress?: (commentId: string) => void;
  onDeletePress?: (commentId: string) => void;
  onReportPress?: (commentId: string) => void;
}

export const CommentRow: React.FC<CommentRowProps> = ({
  comment,
  isReply = false,
  replies = [],
  isRepliesExpanded = false,
  onToggleExpandReplies,
  onReplyPress,
  onLikePress,
  onDeletePress,
  onReportPress,
}) => {
  const { theme, typography } = useTheme();

  const authorName = comment.author?.displayName || comment.author?.username || 'User';
  const isOwner = comment.authorId === 'me' || comment.author?.id === 'me';
  const hasLiked = comment.hasLiked || false;
  const likeCount = comment.likeCount || 0;
  const replyCount = comment.replyCount || 0;

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
      return `${Math.floor(diffSec / 86400)}d`;
    } catch {
      return '';
    }
  };

  return (
    <View
      style={[
        styles.container,
        isReply && styles.replyContainer,
      ]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Comment by ${authorName}: ${comment.text}`}
    >
      <View style={styles.contentRow}>
        {/* Avatar */}
        <Avatar
          source={comment.author?.avatarUrl}
          name={authorName}
          size={isReply ? 'sm' : 'md'}
          isVerified={comment.author?.verificationStatus === 'verified'}
        />

        {/* Comment Body */}
        <View style={styles.textColumn}>
          <View style={styles.headerLine}>
            <Text
              style={[
                styles.authorText,
                { color: theme.text, fontSize: typography.fontSize.sm },
              ]}
              numberOfLines={1}
            >
              {authorName}
            </Text>
            <Text
              style={[
                styles.dateText,
                { color: theme.textSecondary, fontSize: typography.fontSize.xs },
              ]}
            >
              {formatDate(comment.createdAt)}
            </Text>
          </View>

          <Text
            style={[
              styles.commentText,
              { color: theme.text, fontSize: typography.fontSize.sm },
            ]}
          >
            {comment.text}
          </Text>

          {/* Action Row: Reply / Delete / Report */}
          <View style={styles.actionsLine}>
            <TouchableOpacity
              style={[styles.actionTouch, A11yStandards.minTouchTarget]}
              onPress={() => onReplyPress?.(comment)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Reply to ${authorName}`}
            >
              <Text style={[styles.actionText, { color: theme.textSecondary }]}>
                Reply
              </Text>
            </TouchableOpacity>

            {isOwner ? (
              <TouchableOpacity
                style={[styles.actionTouch, A11yStandards.minTouchTarget]}
                onPress={() => onDeletePress?.(comment.id)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Delete comment"
              >
                <Text style={[styles.actionText, { color: BrandColors.pink }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionTouch, A11yStandards.minTouchTarget]}
                onPress={() => onReportPress?.(comment.id)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Report comment"
              >
                <Text style={[styles.actionText, { color: theme.textSecondary }]}>
                  Report
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Like Button */}
        <TouchableOpacity
          style={[styles.likeButton, A11yStandards.minTouchTarget]}
          onPress={() => onLikePress?.(comment.id)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={hasLiked ? 'Unlike comment' : 'Like comment'}
          accessibilityState={{ selected: hasLiked }}
        >
          <Ionicons
            name={hasLiked ? 'heart' : 'heart-outline'}
            size={18}
            color={hasLiked ? BrandColors.pink : theme.textSecondary}
          />
          {likeCount > 0 && (
            <Text
              style={[
                styles.likeCountText,
                { color: hasLiked ? BrandColors.pink : theme.textSecondary },
              ]}
            >
              {likeCount}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Nested Replies Toggle & Render (Only on top-level comments) */}
      {!isReply && replyCount > 0 && (
        <View style={styles.repliesSection}>
          <TouchableOpacity
            style={[styles.repliesToggle, A11yStandards.minTouchTarget]}
            onPress={() => onToggleExpandReplies?.(comment.id)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={
              isRepliesExpanded
                ? `Hide ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`
                : `View ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`
            }
          >
            <View style={[styles.repliesLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.repliesToggleText, { color: theme.textSecondary }]}>
              {isRepliesExpanded
                ? 'Hide replies'
                : `View ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`}
            </Text>
            <Ionicons
              name={isRepliesExpanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          {isRepliesExpanded && replies.length > 0 && (
            <View style={styles.repliesList}>
              {replies.map((reply) => (
                <CommentRow
                  key={reply.id}
                  comment={reply}
                  isReply={true}
                  onReplyPress={onReplyPress}
                  onLikePress={onLikePress}
                  onDeletePress={onDeletePress}
                  onReportPress={onReportPress}
                />
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  replyContainer: {
    paddingVertical: 8,
    paddingHorizontal: 0,
    paddingLeft: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  textColumn: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  authorText: {
    fontWeight: '600',
  },
  dateText: {},
  commentText: {
    lineHeight: 18,
    marginBottom: 4,
  },
  actionsLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 2,
  },
  actionTouch: {
    minHeight: 28,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  likeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
    minWidth: 36,
  },
  likeCountText: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  repliesSection: {
    marginLeft: 48,
    marginTop: 4,
  },
  repliesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  repliesLine: {
    width: 24,
    height: 1,
  },
  repliesToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  repliesList: {
    marginTop: 4,
  },
});
