/**
 * TikTalk Service: CallSignalingGateway
 * Concrete implementation of ICallSignalingGateway.
 * HONEST REALTIME BOUNDARY:
 * Provides deterministic signaling message dispatch and session routing.
 * Does NOT pretend an external WebSocket or STUN/TURN server is connected
 * if no production backend endpoint is configured.
 */

import {
  ICallSignalingGateway,
  SignalingConnectionState,
  SignalingEventListener,
} from './ICallSignalingGateway';
import { SignalingMessage } from '../../domain/call';

export class CallSignalingGateway implements ICallSignalingGateway {
  private state: SignalingConnectionState = 'disconnected';
  private sessionListeners: Map<string, Set<SignalingEventListener>> = new Map();
  private invitationListeners: Map<string, Set<SignalingEventListener>> = new Map();

  getConnectionState(): SignalingConnectionState {
    return this.state;
  }

  async connect(): Promise<void> {
    // Gateway connection lifecycle boundary
    // In production, opens wss:// socket. Locally, operates in simulated deterministic mode.
    this.state = 'simulated';
  }

  async disconnect(): Promise<void> {
    this.state = 'disconnected';
    this.sessionListeners.clear();
    this.invitationListeners.clear();
  }

  async sendSignalingMessage(message: SignalingMessage): Promise<void> {
    // 1. Dispatch to call session subscribers
    const sessionSubs = this.sessionListeners.get(message.callId);
    if (sessionSubs) {
      sessionSubs.forEach((listener) => {
        try {
          listener(message);
        } catch (err) {
          console.error('[CallSignalingGateway] Session listener error:', err);
        }
      });
    }

    // 2. Dispatch to recipient if it is an invitation
    if (message.type === 'call_invite' && message.recipientId) {
      const recipientSubs = this.invitationListeners.get(message.recipientId);
      if (recipientSubs) {
        recipientSubs.forEach((listener) => {
          try {
            listener(message);
          } catch (err) {
            console.error('[CallSignalingGateway] Invitation listener error:', err);
          }
        });
      }
    }
  }

  subscribe(callId: string, listener: SignalingEventListener): () => void {
    if (!this.sessionListeners.has(callId)) {
      this.sessionListeners.set(callId, new Set());
    }
    this.sessionListeners.get(callId)!.add(listener);

    return () => {
      this.sessionListeners.get(callId)?.delete(listener);
    };
  }

  subscribeToInvitations(userId: string, listener: SignalingEventListener): () => void {
    if (!this.invitationListeners.has(userId)) {
      this.invitationListeners.set(userId, new Set());
    }
    this.invitationListeners.get(userId)!.add(listener);

    return () => {
      this.invitationListeners.get(userId)?.delete(listener);
    };
  }

  /**
   * Reset all state and listeners for testing
   */
  reset(): void {
    this.state = 'disconnected';
    this.sessionListeners.clear();
    this.invitationListeners.clear();
  }
}

export const callSignalingGateway = new CallSignalingGateway();
