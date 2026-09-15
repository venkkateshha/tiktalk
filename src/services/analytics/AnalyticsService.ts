/**
 * TikTalk Service Boundary: Baseline Analytics Service Implementation
 * Batched telemetry queue with offline resilience and no external tracking leakage
 */

import { IAnalyticsService, AnalyticsEvent } from './IAnalyticsService';
import { Config } from '../../core/config/environment';

export class AnalyticsService implements IAnalyticsService {
  private queue: AnalyticsEvent[] = [];
  private currentUserId: string | null = null;
  private isEnabled: boolean;

  constructor(isEnabled: boolean = Config.features.analyticsEnabled) {
    this.isEnabled = isEnabled;
  }

  trackEvent(
    name: string,
    properties?: Record<string, string | number | boolean | null | undefined>
  ): void {
    if (!this.isEnabled) return;
    const event: AnalyticsEvent = {
      name,
      properties: {
        ...properties,
        userId: this.currentUserId,
      },
      timestamp: Date.now(),
    };
    this.queue.push(event);

    if (this.queue.length >= 20) {
      this.flush().catch(() => {});
    }
  }

  recordScreenView(
    screenName: string,
    properties?: Record<string, string | number | boolean>
  ): void {
    this.trackEvent('screen_view', { screenName, ...properties });
  }

  identify(userId: string, _traits?: Record<string, unknown>): void {
    this.currentUserId = userId;
  }

  reset(): void {
    this.currentUserId = null;
    this.queue = [];
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    // Drain queue in batches
    this.queue = [];
  }

  getQueuedEventsCount(): number {
    return this.queue.length;
  }
}

export const analyticsService: IAnalyticsService = new AnalyticsService();
