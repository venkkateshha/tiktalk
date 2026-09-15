/**
 * TikTalk Phase 8: Engagement & Story Notification Bridge
 * Translates domain engagement events (likes, comments, replies, reposts, follows, stories)
 * into typed notification contracts without mutating or duplicating engagement state.
 */

import { AppNotification, NotificationType } from '../../domain/notification';
import { User } from '../../domain/user';

export interface EngagementNotificationParams {
  recipientId: string;
  sender?: User;
  senderId?: string;
  postId?: string;
  commentId?: string;
  storyId?: string;
  previewText?: string;
  thumbnailUrl?: string;
}

export class EngagementNotificationBridge {
  /**
   * Build a typed notification payload for a Like interaction
   */
  static createLikeNotification(
    params: EngagementNotificationParams
  ): Omit<AppNotification, 'id' | 'createdAt' | 'isRead'> {
    const senderName = params.sender?.displayName || params.sender?.username || 'Someone';
    return {
      recipientId: params.recipientId,
      senderId: params.senderId || params.sender?.id,
      sender: params.sender,
      type: 'like',
      title: 'New Like',
      body: `${senderName} liked your video`,
      targetId: params.postId,
      targetType: 'post',
      thumbnailUrl: params.thumbnailUrl,
    };
  }

  /**
   * Build a typed notification payload for a Comment interaction
   */
  static createCommentNotification(
    params: EngagementNotificationParams & { commentText: string }
  ): Omit<AppNotification, 'id' | 'createdAt' | 'isRead'> {
    const senderName = params.sender?.displayName || params.sender?.username || 'Someone';
    return {
      recipientId: params.recipientId,
      senderId: params.senderId || params.sender?.id,
      sender: params.sender,
      type: 'comment',
      title: 'New Comment',
      body: `${senderName} commented: "${params.commentText}"`,
      targetId: params.postId,
      targetType: 'post',
      thumbnailUrl: params.thumbnailUrl,
    };
  }

  /**
   * Build a typed notification payload for a Comment Reply interaction
   */
  static createReplyNotification(
    params: EngagementNotificationParams & { replyText: string }
  ): Omit<AppNotification, 'id' | 'createdAt' | 'isRead'> {
    const senderName = params.sender?.displayName || params.sender?.username || 'Someone';
    return {
      recipientId: params.recipientId,
      senderId: params.senderId || params.sender?.id,
      sender: params.sender,
      type: 'reply',
      title: 'New Reply',
      body: `${senderName} replied: "${params.replyText}"`,
      targetId: params.postId,
      targetType: 'comment',
      thumbnailUrl: params.thumbnailUrl,
    };
  }

  /**
   * Build a typed notification payload for a Repost interaction
   */
  static createRepostNotification(
    params: EngagementNotificationParams
  ): Omit<AppNotification, 'id' | 'createdAt' | 'isRead'> {
    const senderName = params.sender?.displayName || params.sender?.username || 'Someone';
    return {
      recipientId: params.recipientId,
      senderId: params.senderId || params.sender?.id,
      sender: params.sender,
      type: 'repost',
      title: 'Video Reposted',
      body: `${senderName} reposted your video`,
      targetId: params.postId,
      targetType: 'post',
      thumbnailUrl: params.thumbnailUrl,
    };
  }

  /**
   * Build a typed notification payload for a Follow interaction
   */
  static createFollowNotification(
    params: EngagementNotificationParams
  ): Omit<AppNotification, 'id' | 'createdAt' | 'isRead'> {
    const senderName = params.sender?.displayName || params.sender?.username || 'Someone';
    return {
      recipientId: params.recipientId,
      senderId: params.senderId || params.sender?.id,
      sender: params.sender,
      type: 'follow',
      title: 'New Follower',
      body: `${senderName} started following you`,
      targetId: params.senderId || params.sender?.id,
      targetType: 'profile',
    };
  }

  /**
   * Build a typed notification payload for Story interactions
   */
  static createStoryNotification(
    type: 'story_reaction' | 'story_reply' | 'story_view',
    params: EngagementNotificationParams & { message?: string }
  ): Omit<AppNotification, 'id' | 'createdAt' | 'isRead'> {
    const senderName = params.sender?.displayName || params.sender?.username || 'Someone';
    let body = `${senderName} viewed your story`;
    if (type === 'story_reaction') {
      body = `${senderName} reacted ${params.message || '❤️'} to your story`;
    } else if (type === 'story_reply') {
      body = `${senderName} replied to your story: "${params.message || ''}"`;
    }

    return {
      recipientId: params.recipientId,
      senderId: params.senderId || params.sender?.id,
      sender: params.sender,
      type,
      title: 'Story Activity',
      body,
      targetId: params.storyId,
      targetType: 'story',
      thumbnailUrl: params.thumbnailUrl,
    };
  }
}
