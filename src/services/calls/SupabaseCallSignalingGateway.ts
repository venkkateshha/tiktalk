/**
 * TikTalk Service: SupabaseCallSignalingGateway
 * Production implementation of ICallSignalingGateway backed by Supabase Realtime Broadcast.
 * Provides deterministic channel scoping per call (call:{callId}) and per user (user:{userId}).
 * Implements strict echo protection, duplicate event suppression, and channel teardown.
 * Gracefully falls back to simulated local dispatch when unconfigured.
 */

import {
  ICallSignalingGateway,
  SignalingConnectionState,
  SignalingEventListener,
} from './ICallSignalingGateway';
import { SignalingMessage } from '../../domain/call';
import { getSupabaseClient, isSupabaseConfigured } from '../../core/supabase';

export interface SupabaseSignalingEnvelope {
  senderClientId: string;
  targetType: 'session' | 'invitation';
  targetId: string;
  message: SignalingMessage;
}

export class SupabaseCallSignalingGateway implements ICallSignalingGateway {
  private clientId: string;
  private state: SignalingConnectionState = 'disconnected';
  private sessionListeners: Map<string, Set<SignalingEventListener>> = new Map();
  private invitationListeners: Map<string, Set<SignalingEventListener>> = new Map();
  private realtimeChannels: Map<string, any> = new Map();
  private seenMessageIds: Set<string> = new Set();
  private maxSeenCacheSize: number = 500;
  private customSupabaseClient: any = null;

  constructor(customClient?: any) {
    this.clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    if (customClient) {
      this.customSupabaseClient = customClient;
    }
  }

  public getClientId(): string {
    return this.clientId;
  }

  private getClient(): any {
    if (this.customSupabaseClient) {
      return this.customSupabaseClient;
    }
    return getSupabaseClient();
  }

  private isConfigured(): boolean {
    if (this.customSupabaseClient) {
      return true;
    }
    return isSupabaseConfigured();
  }

  getConnectionState(): SignalingConnectionState {
    return this.state;
  }

  async connect(): Promise<void> {
    const supabase = this.getClient();
    if (!supabase || !this.isConfigured()) {
      // Deterministic offline/simulated fallback
      this.state = 'simulated';
      return;
    }

    this.state = 'connected';
  }

  async disconnect(): Promise<void> {
    const supabase = this.getClient();
    if (supabase) {
      for (const [_, channel] of this.realtimeChannels) {
        try {
          if (typeof supabase.removeChannel === 'function') {
            supabase.removeChannel(channel);
          } else if (typeof channel.unsubscribe === 'function') {
            channel.unsubscribe();
          }
        } catch {}
      }
    }

    this.realtimeChannels.clear();
    this.sessionListeners.clear();
    this.invitationListeners.clear();
    this.seenMessageIds.clear();
    this.state = 'disconnected';
  }

  private recordSeenMessage(id: string): void {
    if (this.seenMessageIds.size >= this.maxSeenCacheSize) {
      const oldest = this.seenMessageIds.values().next().value;
      if (oldest) this.seenMessageIds.delete(oldest);
    }
    this.seenMessageIds.add(id);
  }

  private parsePayload(raw: any): { msg: SignalingMessage; senderClientId?: string } | null {
    if (!raw || typeof raw !== 'object') return null;
    if (raw.senderClientId && raw.message) {
      return { msg: raw.message as SignalingMessage, senderClientId: raw.senderClientId };
    }
    if (raw.id && raw.type && raw.callId) {
      return { msg: raw as SignalingMessage, senderClientId: raw.senderId };
    }
    return null;
  }

  async sendSignalingMessage(message: SignalingMessage): Promise<void> {
    // Validate message envelope integrity
    if (!message || !message.id || !message.type || !message.callId) {
      return;
    }

    // Record seen to prevent local echo/duplicate
    this.recordSeenMessage(message.id);

    const supabase = this.getClient();

    // 1. Dispatch over Supabase Realtime Broadcast if connected
    if (supabase && this.isConfigured() && this.state === 'connected') {
      // Send to call session channel
      const callChannelName = `call:${message.callId}`;
      let callChannel = this.realtimeChannels.get(callChannelName);
      if (!callChannel) {
        callChannel = supabase.channel(callChannelName, {
          config: { broadcast: { self: false } },
        });
        callChannel.subscribe();
        this.realtimeChannels.set(callChannelName, callChannel);
      }

      const sessionEnvelope: SupabaseSignalingEnvelope = {
        senderClientId: this.clientId,
        targetType: 'session',
        targetId: message.callId,
        message,
      };

      await callChannel.send({
        type: 'broadcast',
        event: 'signaling',
        payload: sessionEnvelope,
      });

      // If call_invite with a recipientId, also broadcast to user's invitation channel
      if (message.type === 'call_invite' && message.recipientId) {
        const userChannelName = `user:${message.recipientId}`;
        let userChannel = this.realtimeChannels.get(userChannelName);
        if (!userChannel) {
          userChannel = supabase.channel(userChannelName, {
            config: { broadcast: { self: false } },
          });
          userChannel.subscribe();
          this.realtimeChannels.set(userChannelName, userChannel);
        }

        const inviteEnvelope: SupabaseSignalingEnvelope = {
          senderClientId: this.clientId,
          targetType: 'invitation',
          targetId: message.recipientId,
          message,
        };

        await userChannel.send({
          type: 'broadcast',
          event: 'call_invite',
          payload: inviteEnvelope,
        });
      }
    }

    // 2. Dispatch locally for in-process subscribers when not connected to Realtime
    if (this.state !== 'connected') {
      const sessionSubs = this.sessionListeners.get(message.callId);
      if (sessionSubs) {
        sessionSubs.forEach((listener) => {
          try {
            listener(message);
          } catch (err) {
            console.error('[SupabaseCallSignalingGateway] Session listener error:', err);
          }
        });
      }

      if (message.type === 'call_invite' && message.recipientId) {
        const recipientSubs = this.invitationListeners.get(message.recipientId);
        if (recipientSubs) {
          recipientSubs.forEach((listener) => {
            try {
              listener(message);
            } catch (err) {
              console.error('[SupabaseCallSignalingGateway] Invitation listener error:', err);
            }
          });
        }
      }
    }
  }

  subscribe(callId: string, listener: SignalingEventListener): () => void {
    if (!this.sessionListeners.has(callId)) {
      this.sessionListeners.set(callId, new Set());
    }
    this.sessionListeners.get(callId)!.add(listener);

    // Setup Supabase Realtime channel if configured
    const supabase = this.getClient();
    const channelName = `call:${callId}`;
    if (supabase && this.isConfigured() && !this.realtimeChannels.has(channelName)) {
      const channel = supabase.channel(channelName, {
        config: { broadcast: { self: false } },
      });

      channel
        .on('broadcast', { event: 'signaling' }, ({ payload }: { payload: any }) => {
          const parsed = this.parsePayload(payload);
          if (!parsed) return;

          // Echo protection: discard message from our own client instance
          if (parsed.senderClientId === this.clientId) {
            return;
          }

          // Duplicate protection: discard if already processed
          if (this.seenMessageIds.has(parsed.msg.id)) {
            return;
          }
          this.recordSeenMessage(parsed.msg.id);

          const subs = this.sessionListeners.get(callId);
          subs?.forEach((cb) => {
            try {
              cb(parsed.msg);
            } catch (err) {
              console.error('[SupabaseCallSignalingGateway] Realtime listener error:', err);
            }
          });
        })
        .subscribe();

      this.realtimeChannels.set(channelName, channel);
    }

    return () => {
      const subs = this.sessionListeners.get(callId);
      subs?.delete(listener);
      if (subs && subs.size === 0) {
        this.sessionListeners.delete(callId);
        const channel = this.realtimeChannels.get(channelName);
        if (channel && supabase) {
          try {
            if (typeof supabase.removeChannel === 'function') {
              supabase.removeChannel(channel);
            } else if (typeof channel.unsubscribe === 'function') {
              channel.unsubscribe();
            }
          } catch {}
          this.realtimeChannels.delete(channelName);
        }
      }
    };
  }

  subscribeToInvitations(userId: string, listener: SignalingEventListener): () => void {
    if (!this.invitationListeners.has(userId)) {
      this.invitationListeners.set(userId, new Set());
    }
    this.invitationListeners.get(userId)!.add(listener);

    // Setup Supabase Realtime channel for user invitations
    const supabase = this.getClient();
    const channelName = `user:${userId}`;
    if (supabase && this.isConfigured() && !this.realtimeChannels.has(channelName)) {
      const channel = supabase.channel(channelName, {
        config: { broadcast: { self: false } },
      });

      channel
        .on('broadcast', { event: 'call_invite' }, ({ payload }: { payload: any }) => {
          const parsed = this.parsePayload(payload);
          if (!parsed) return;

          // Echo protection: discard message from our own client instance
          if (parsed.senderClientId === this.clientId) {
            return;
          }

          // Duplicate protection: discard if already processed
          if (this.seenMessageIds.has(parsed.msg.id)) {
            return;
          }
          this.recordSeenMessage(parsed.msg.id);

          const subs = this.invitationListeners.get(userId);
          subs?.forEach((cb) => {
            try {
              cb(parsed.msg);
            } catch (err) {
              console.error('[SupabaseCallSignalingGateway] Invitation error:', err);
            }
          });
        })
        .subscribe();

      this.realtimeChannels.set(channelName, channel);
    }

    return () => {
      const subs = this.invitationListeners.get(userId);
      subs?.delete(listener);
      if (subs && subs.size === 0) {
        this.invitationListeners.delete(userId);
        const channel = this.realtimeChannels.get(channelName);
        if (channel && supabase) {
          try {
            if (typeof supabase.removeChannel === 'function') {
              supabase.removeChannel(channel);
            } else if (typeof channel.unsubscribe === 'function') {
              channel.unsubscribe();
            }
          } catch {}
          this.realtimeChannels.delete(channelName);
        }
      }
    };
  }

  reset(): void {
    this.disconnect();
  }
}

export const supabaseCallSignalingGateway: ICallSignalingGateway = new SupabaseCallSignalingGateway();

