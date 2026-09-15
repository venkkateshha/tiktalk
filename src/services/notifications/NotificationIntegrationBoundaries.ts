/**
 * TikTalk Phase 8: Future Integration Contracts Boundary
 * Typed contracts and factories for future phase integrations:
 * Chat, Calls, Live, Creator earnings, Admin announcements, and Security events.
 * ZERO fake data: defines contracts and boundaries without premature execution.
 */

import { AppNotification } from '../../domain/notification';

export interface EarningsNotificationParams {
  recipientId: string;
  amountFormatted: string;
  payoutDate: string;
}

export interface SecurityNotificationParams {
  recipientId: string;
  alertTitle: string;
  details: string;
  severity?: 'normal' | 'high' | 'critical';
}

export interface AdminAnnouncementParams {
  recipientId: string;
  title: string;
  body: string;
  announcementId: string;
  actionUrl?: string;
}

export interface LiveNotificationParams {
  recipientId: string;
  creatorId: string;
  creatorName: string;
  streamId: string;
  avatarUrl?: string;
}

export interface MessageNotificationParams {
  recipientId: string;
  senderId: string;
  senderName: string;
  previewText: string;
  conversationId: string;
  avatarUrl?: string;
}

export class NotificationIntegrationBoundaries {
  /**
   * Payout / Creator Earnings Boundary (Phase 11+)
   */
  static createEarningsNotification(
    params: EarningsNotificationParams
  ): Omit<AppNotification, 'id' | 'createdAt' | 'isRead'> {
    return {
      recipientId: params.recipientId,
      type: 'monetization',
      title: 'Weekly Payout Ready',
      body: `Your Monday UPI payout of ${params.amountFormatted} for ${params.payoutDate} has been processed.`,
      targetId: 'wallet',
      targetType: 'wallet',
    };
  }

  /**
   * Account & Security Alerts Boundary (Always active)
   */
  static createSecurityNotification(
    params: SecurityNotificationParams
  ): Omit<AppNotification, 'id' | 'createdAt' | 'isRead'> {
    return {
      recipientId: params.recipientId,
      type: 'security',
      title: params.alertTitle,
      body: params.details,
      targetId: 'settings',
      targetType: 'settings',
    };
  }

  /**
   * Official Admin Platform Announcements Boundary
   */
  static createAdminAnnouncement(
    params: AdminAnnouncementParams
  ): Omit<AppNotification, 'id' | 'createdAt' | 'isRead'> {
    return {
      recipientId: params.recipientId,
      type: 'announcement',
      title: params.title,
      body: params.body,
      targetId: params.announcementId,
      targetType: 'external',
      target: {
        type: 'external',
        id: params.announcementId,
        url: params.actionUrl,
      },
    };
  }

  /**
   * Live Broadcast Alerts Boundary (Phase 12+)
   */
  static createLiveNotification(
    params: LiveNotificationParams
  ): Omit<AppNotification, 'id' | 'createdAt' | 'isRead'> {
    return {
      recipientId: params.recipientId,
      senderId: params.creatorId,
      type: 'live',
      title: `${params.creatorName} is LIVE!`,
      body: `Watch ${params.creatorName}'s LIVE stream now`,
      targetId: params.streamId,
      targetType: 'live',
      thumbnailUrl: params.avatarUrl,
    };
  }

  /**
   * Direct Messaging & Chat Alerts Boundary (Phase 9)
   */
  static createMessageNotification(
    params: MessageNotificationParams
  ): Omit<AppNotification, 'id' | 'createdAt' | 'isRead'> {
    return {
      recipientId: params.recipientId,
      senderId: params.senderId,
      type: 'message',
      title: params.senderName,
      body: params.previewText,
      targetId: params.conversationId,
      targetType: 'chat',
      thumbnailUrl: params.avatarUrl,
    };
  }
}
