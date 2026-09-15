/**
 * TikTalk Service Boundary: Baseline Notifications Service Implementation
 */

import { INotificationsService } from './INotificationsService';
import { AppNotification } from '../../domain/notification';
import { IApiClient, apiClient } from '../api';

export class NotificationsService implements INotificationsService {
  private client: IApiClient;

  constructor(client: IApiClient = apiClient) {
    this.client = client;
  }

  async registerPushToken(token: string, platform: 'ios' | 'android' | 'web'): Promise<void> {
    await this.client.post('/notifications/register-token', { token, platform });
  }

  async getNotifications(limit: number = 20, offset: number = 0): Promise<AppNotification[]> {
    const res = await this.client.get<AppNotification[]>('/notifications', {
      params: { limit, offset },
    });
    return res.data;
  }

  async getUnreadCount(): Promise<number> {
    const res = await this.client.get<{ count: number }>('/notifications/unread-count');
    return res.data.count;
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.client.post(`/notifications/${notificationId}/read`);
  }

  async markAllAsRead(): Promise<void> {
    await this.client.post('/notifications/read-all');
  }
}

export const notificationsService: INotificationsService = new NotificationsService();
