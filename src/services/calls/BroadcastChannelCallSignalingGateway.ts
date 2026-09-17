/**
 * TikTalk Service: BroadcastChannelCallSignalingGateway
 * Local browser-only signaling adapter leveraging the W3C BroadcastChannel API.
 * Enables two independent browser tabs/windows to exchange real WebRTC signaling
 * events (invitation, offer, answer, ICE candidates, accept, reject, busy, end)
 * during local development without connecting to external cloud infrastructure.
 *
 * SAFETY & INTEGRITY:
 * - Browser BroadcastChannel API only.
 * - Does NOT use localStorage.
 * - Enforces client instance ID checks to prevent echo loops.
 * - Tracks processed message IDs to eliminate duplicates.
 * - Cleanly closes channels and deregisters listeners on teardown.
 * - Gracefully falls back to in-memory dispatch when BroadcastChannel is unavailable.
 */

import {
  ICallSignalingGateway,
  SignalingConnectionState,
  SignalingEventListener,
} from './ICallSignalingGateway';
import { SignalingMessage } from '../../domain/call';
import { CallSignalingGateway } from './CallSignalingGateway';

interface BroadcastEnvelope {
  senderClientId: string;
  targetType: 'session' | 'invitation';
  targetId: string;
  message: SignalingMessage;
}

export class BroadcastChannelCallSignalingGateway implements ICallSignalingGateway {
  private clientId: string;
  private channelName: string;
  private bc: any = null; // BroadcastChannel instance
  private state: SignalingConnectionState = 'disconnected';
  private sessionListeners: Map<string, Set<SignalingEventListener>> = new Map();
  private invitationListeners: Map<string, Set<SignalingEventListener>> = new Map();
  private seenMessageIds: Set<string> = new Set();
  private maxSeenCacheSize: number = 500;

  constructor(channelName: string = 'tiktalk_local_call_signaling') {
    this.channelName = channelName;
    this.clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    this.initBroadcastChannel();
  }

  public getClientId(): string {
    return this.clientId;
  }

  private isBroadcastChannelAvailable(): boolean {
    return typeof BroadcastChannel !== 'undefined';
  }

  private initBroadcastChannel(): void {
    if (!this.isBroadcastChannelAvailable()) {
      this.state = 'simulated';
      return;
    }

    try {
      if (this.bc) {
        this.bc.close();
      }

      this.bc = new BroadcastChannel(this.channelName);
      this.bc.onmessage = (event: any) => {
        this.handleIncomingBroadcast(event.data);
      };
      this.bc.onmessageerror = (err: any) => {
        console.warn('[BroadcastChannelSignaling] Message deserialization error:', err);
      };
      this.state = 'connected';
    } catch (err) {
      console.warn('[BroadcastChannelSignaling] Failed to initialize BroadcastChannel:', err);
      this.state = 'simulated';
      this.bc = null;
    }
  }

  private handleIncomingBroadcast(envelope: unknown): void {
    if (!envelope || typeof envelope !== 'object') return;
    const data = envelope as BroadcastEnvelope;

    // 1. Discard messages originated by this client instance (Echo protection)
    if (data.senderClientId === this.clientId) {
      return;
    }

    // 2. Validate envelope format and message payload
    const msg = data.message;
    if (!msg || !msg.id || !msg.type || !msg.callId) {
      return;
    }

    // 3. Duplicate event suppression
    if (this.seenMessageIds.has(msg.id)) {
      return;
    }
    this.recordSeenMessage(msg.id);

    // 4. Session routing
    if (data.targetType === 'session') {
      const listeners = this.sessionListeners.get(data.targetId);
      if (listeners) {
        listeners.forEach((listener) => {
          try {
            listener(msg);
          } catch (err) {
            console.error('[BroadcastChannelSignaling] Session listener error:', err);
          }
        });
      }
    }

    // 5. User invitation routing
    if (data.targetType === 'invitation') {
      const listeners = this.invitationListeners.get(data.targetId);
      if (listeners) {
        listeners.forEach((listener) => {
          try {
            listener(msg);
          } catch (err) {
            console.error('[BroadcastChannelSignaling] Invitation listener error:', err);
          }
        });
      }
    }
  }

  private recordSeenMessage(id: string): void {
    if (this.seenMessageIds.size >= this.maxSeenCacheSize) {
      const oldest = this.seenMessageIds.values().next().value;
      if (oldest) this.seenMessageIds.delete(oldest);
    }
    this.seenMessageIds.add(id);
  }

  getConnectionState(): SignalingConnectionState {
    return this.state;
  }

  async connect(): Promise<void> {
    if (!this.bc && this.isBroadcastChannelAvailable()) {
      this.initBroadcastChannel();
    } else if (!this.isBroadcastChannelAvailable()) {
      this.state = 'simulated';
    }
  }

  async disconnect(): Promise<void> {
    if (this.bc) {
      try {
        this.bc.onmessage = null;
        this.bc.onmessageerror = null;
        this.bc.close();
      } catch {}
      this.bc = null;
    }
    this.sessionListeners.clear();
    this.invitationListeners.clear();
    this.seenMessageIds.clear();
    this.state = 'disconnected';
  }

  async sendSignalingMessage(message: SignalingMessage): Promise<void> {
    if (!message || !message.id) return;
    this.recordSeenMessage(message.id);

    // 1. Dispatch locally to in-process subscribers
    const localSessionSubs = this.sessionListeners.get(message.callId);
    if (localSessionSubs) {
      localSessionSubs.forEach((listener) => {
        try {
          listener(message);
        } catch (err) {
          console.error('[BroadcastChannelSignaling] Local session error:', err);
        }
      });
    }

    if (message.type === 'call_invite' && message.recipientId) {
      const localInviteSubs = this.invitationListeners.get(message.recipientId);
      if (localInviteSubs) {
        localInviteSubs.forEach((listener) => {
          try {
            listener(message);
          } catch (err) {
            console.error('[BroadcastChannelSignaling] Local invite error:', err);
          }
        });
      }
    }

    // 2. Broadcast across browser tabs if BroadcastChannel is active
    if (this.bc && this.state === 'connected') {
      try {
        // Broadcast session envelope
        const sessionEnvelope: BroadcastEnvelope = {
          senderClientId: this.clientId,
          targetType: 'session',
          targetId: message.callId,
          message,
        };
        this.bc.postMessage(sessionEnvelope);

        // If this is an invitation, broadcast user-targeted envelope
        if (message.type === 'call_invite' && message.recipientId) {
          const inviteEnvelope: BroadcastEnvelope = {
            senderClientId: this.clientId,
            targetType: 'invitation',
            targetId: message.recipientId,
            message,
          };
          this.bc.postMessage(inviteEnvelope);
        }
      } catch (err) {
        console.warn('[BroadcastChannelSignaling] BroadcastChannel postMessage failed:', err);
      }
    }
  }

  subscribe(callId: string, listener: SignalingEventListener): () => void {
    if (!this.sessionListeners.has(callId)) {
      this.sessionListeners.set(callId, new Set());
    }
    this.sessionListeners.get(callId)!.add(listener);

    return () => {
      const set = this.sessionListeners.get(callId);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.sessionListeners.delete(callId);
        }
      }
    };
  }

  subscribeToInvitations(userId: string, listener: SignalingEventListener): () => void {
    if (!this.invitationListeners.has(userId)) {
      this.invitationListeners.set(userId, new Set());
    }
    this.invitationListeners.get(userId)!.add(listener);

    return () => {
      const set = this.invitationListeners.get(userId);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.invitationListeners.delete(userId);
        }
      }
    };
  }

  reset(): void {
    this.disconnect();
    this.initBroadcastChannel();
  }
}

export const broadcastChannelCallSignalingGateway =
  new BroadcastChannelCallSignalingGateway();
