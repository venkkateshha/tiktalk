/**
 * TikTalk Service: CallHistoryService
 * Persists authentic voice & video call history records.
 * STRICT ZERO FAKE DATA: Returns honest empty logs initially.
 * Stores completed, missed, and declined call records in local storage.
 */

import { CallSession, CallHistoryRecord } from '../../domain/call';

const CALL_HISTORY_STORAGE_KEY = 'tiktalk:call_history';

export class CallHistoryService {
  private inMemoryRecords: CallHistoryRecord[] = [];
  private isLoaded = false;

  private async load(): Promise<void> {
    if (this.isLoaded) return;
    try {
      if (typeof localStorage !== 'undefined') {
        const json = localStorage.getItem(CALL_HISTORY_STORAGE_KEY);
        if (json) {
          this.inMemoryRecords = JSON.parse(json);
        }
      }
    } catch {
      // Storage unavailable or disabled
    }
    this.isLoaded = true;
  }

  private async save(): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(CALL_HISTORY_STORAGE_KEY, JSON.stringify(this.inMemoryRecords));
      }
    } catch {
      // Storage save error
    }
  }

  /**
   * Records a completed or terminated call session into history
   */
  async recordCall(session: CallSession, currentUserId: string): Promise<CallHistoryRecord> {
    await this.load();

    const isOutgoing = session.initiatorId === currentUserId;
    const otherParticipants = session.participants.filter((p) => p.userId !== currentUserId);

    const record: CallHistoryRecord = {
      id: `ch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      callSessionId: session.id,
      conversationId: session.conversationId,
      type: session.type,
      direction: isOutgoing ? 'outgoing' : 'incoming',
      status: session.status,
      durationSeconds: session.durationSeconds,
      participants: otherParticipants.map((p) => ({
        userId: p.userId,
        displayName: p.user?.displayName || p.user?.username || 'User',
        username: p.user?.username || 'user',
        avatarUrl: p.user?.avatarUrl,
      })),
      timestamp: session.endedAt || session.startedAt,
      endReason: session.endReason || 'completed',
    };

    this.inMemoryRecords.unshift(record);
    await this.save();

    return record;
  }

  /**
   * Retrieve honest call history logs
   */
  async getCallHistory(limit: number = 50): Promise<CallHistoryRecord[]> {
    await this.load();
    return this.inMemoryRecords.slice(0, limit);
  }

  /**
   * Clear all call history records
   */
  async clearCallHistory(): Promise<void> {
    this.inMemoryRecords = [];
    await this.save();
  }

  /**
   * Reset in-memory cache for tests
   */
  reset(): void {
    this.inMemoryRecords = [];
    this.isLoaded = false;
  }
}

export const callHistoryService = new CallHistoryService();
