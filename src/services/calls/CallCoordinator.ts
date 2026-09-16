/**
 * TikTalk Service: CallCoordinator
 * Central pub/sub event broker for call lifecycle events,
 * participant state changes, incoming call triggers, and quality metrics.
 * Thread-safe and resilient against listener exceptions.
 */

import { CallSession, CallParticipant, MediaDeviceState, CallQualityStats } from '../../domain/call';

export type CallEventListener = (event: {
  type:
    | 'call_started'
    | 'call_ringing'
    | 'call_connected'
    | 'call_ended'
    | 'participant_updated'
    | 'participant_joined'
    | 'participant_left'
    | 'device_state_changed'
    | 'quality_stats';
  call?: CallSession;
  participant?: CallParticipant;
  deviceState?: MediaDeviceState;
  stats?: CallQualityStats;
}) => void;

export type IncomingCallListener = (call: CallSession) => void;

export class CallCoordinator {
  private static instance: CallCoordinator;
  private listeners: Set<CallEventListener> = new Set();
  private incomingListeners: Set<IncomingCallListener> = new Set();

  public static getInstance(): CallCoordinator {
    if (!CallCoordinator.instance) {
      CallCoordinator.instance = new CallCoordinator();
    }
    return CallCoordinator.instance;
  }

  /**
   * Subscribe to call lifecycle and participant events
   */
  subscribe(listener: CallEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Subscribe specifically to incoming call invitations
   */
  subscribeToIncoming(listener: IncomingCallListener): () => void {
    this.incomingListeners.add(listener);
    return () => {
      this.incomingListeners.delete(listener);
    };
  }

  /**
   * Broadcast call event to all registered listeners
   */
  broadcast(event: Parameters<CallEventListener>[0]): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('[CallCoordinator] Listener error:', err);
      }
    });
  }

  /**
   * Notify subscribers of an incoming call
   */
  notifyIncoming(call: CallSession): void {
    this.incomingListeners.forEach((listener) => {
      try {
        listener(call);
      } catch (err) {
        console.error('[CallCoordinator] Incoming call listener error:', err);
      }
    });
  }

  /**
   * Clear all subscribers (useful for test resets)
   */
  reset(): void {
    this.listeners.clear();
    this.incomingListeners.clear();
  }
}

export const callCoordinator = CallCoordinator.getInstance();
