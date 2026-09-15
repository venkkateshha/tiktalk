/**
 * TikTalk Service Boundary: Analytics & Telemetry Contract
 */

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean | null | undefined>;
  timestamp: number;
}

export interface IAnalyticsService {
  trackEvent(name: string, properties?: Record<string, string | number | boolean | null | undefined>): void;
  recordScreenView(screenName: string, properties?: Record<string, string | number | boolean>): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
  reset(): void;
  flush(): Promise<void>;
}
