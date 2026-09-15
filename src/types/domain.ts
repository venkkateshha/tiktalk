/**
 * TikTalk Legacy Phase 0 Shared Domain Types
 * Preserved for compatibility and extended by src/domain
 */

export interface CreatorLedgerSummary {
  creatorId: string;
  pendingBalance: number;
  clearedBalance: number;
  revSharePercentage: 60;
  nextPayoutDate: string; // Every Monday 10:00 AM IST
  currency: string;
  upiId?: string;
}

export interface SystemStatus {
  phase: 'Phase 0 — Foundation' | 'Phase 1 — Architecture & Design System';
  version: string;
  environment: 'development' | 'staging' | 'production';
  newArchitectureEnabled: boolean;
  webResponsiveSupported: boolean;
}
