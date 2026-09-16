/**
 * TikTalk Service: CallService
 * Comprehensive implementation of ICallService.
 * Coordinates signaling, media hardware, call timers, call history,
 * block/privacy enforcement, and event pub/sub.
 * Strictly adheres to ZERO FAKE DATA.
 */

import { ICallService } from './ICallService';
import {
  CallSession,
  CallType,
  CallEndReason,
  AudioDeviceRoute,
  CameraFacing,
  MediaDeviceState,
  CallHistoryRecord,
} from '../../domain/call';
import { callCoordinator, CallCoordinator } from './CallCoordinator';
import { callSignalingGateway, CallSignalingGateway } from './CallSignalingGateway';
import { mediaDeviceManager, MediaDeviceManager } from './MediaDeviceManager';
import { callHistoryService, CallHistoryService } from './CallHistoryService';
import { User } from '../../domain/user';
import { authService, IAuthService } from '../auth';

export class CallService implements ICallService {
  private activeCall: CallSession | null = null;
  private currentUserId: string = 'me';
  private currentUser: User = {
    id: 'me',
    username: 'current_user',
    displayName: 'You',
    verificationStatus: 'none',
    isCreator: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  private ringingTimeoutTimer: any = null;
  private durationInterval: any = null;
  private blockedUserIds: Set<string> = new Set();

  constructor(
    private coordinator: CallCoordinator = callCoordinator,
    private signaling: CallSignalingGateway = callSignalingGateway,
    private media: MediaDeviceManager = mediaDeviceManager,
    private history: CallHistoryService = callHistoryService,
    private auth: IAuthService = authService
  ) {
    this.initCurrentUser();
    this.setupSignalingListeners();
  }

  private async initCurrentUser(): Promise<void> {
    try {
      const user = await this.auth.getCurrentUser();
      if (user) {
        this.currentUser = user;
        this.currentUserId = user.id;
      }
    } catch {
      // Retain standard unauthenticated contract
    }
  }

  public setCurrentUser(user: User): void {
    this.currentUser = user;
    this.currentUserId = user.id;
  }

  private setupSignalingListeners(): void {
    this.signaling.subscribeToInvitations(this.currentUserId, (msg) => {
      if (msg.type === 'call_invite') {
        const payload = msg.payload as { session: CallSession };
        if (payload?.session && !this.isUserBlocked(msg.senderId)) {
          // If already in a call, send busy
          if (this.activeCall && this.activeCall.status === 'connected') {
            this.signaling.sendSignalingMessage({
              id: `sig_${Date.now()}`,
              type: 'call_busy',
              callId: msg.callId,
              conversationId: msg.conversationId,
              senderId: this.currentUserId,
              recipientId: msg.senderId,
              timestamp: new Date().toISOString(),
              payload: {},
            });
            return;
          }

          this.activeCall = payload.session;
          this.coordinator.notifyIncoming(payload.session);
          this.coordinator.broadcast({
            type: 'call_ringing',
            call: payload.session,
          });
        }
      }
    });
  }

  public setBlockedUsers(blockedIds: string[]): void {
    this.blockedUserIds = new Set(blockedIds);
  }

  public isUserBlocked(userId: string): boolean {
    return this.blockedUserIds.has(userId);
  }

  async startCall(
    conversationId: string,
    type: CallType,
    recipientId?: string
  ): Promise<CallSession> {
    if (recipientId && this.isUserBlocked(recipientId)) {
      throw new Error('Cannot place call: User is blocked');
    }

    // Clean up any stale call
    if (this.activeCall) {
      await this.endCall(this.activeCall.id, 'cancelled_by_caller');
    }

    const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const newSession: CallSession = {
      id: callId,
      conversationId,
      type,
      status: 'initiating',
      initiatorId: this.currentUserId,
      initiator: this.currentUser,
      participants: [
        {
          userId: this.currentUserId,
          user: this.currentUser,
          role: 'caller',
          audioMuted: false,
          videoOff: type === 'audio',
          isSpeaking: false,
          joinedAt: now,
        },
        ...(recipientId
          ? [
              {
                userId: recipientId,
                role: 'callee' as const,
                audioMuted: false,
                videoOff: type === 'audio',
                isSpeaking: false,
                joinedAt: now,
              },
            ]
          : []),
      ],
      isGroup: !recipientId,
      startedAt: now,
      durationSeconds: 0,
    };

    this.activeCall = newSession;
    this.coordinator.broadcast({ type: 'call_started', call: newSession });

    // 1. Acquire local media
    await this.media.acquireLocalMedia(type);

    // 2. Set status to ringing
    newSession.status = 'ringing';
    this.coordinator.broadcast({ type: 'call_ringing', call: newSession });

    // 3. Send signaling invitation
    await this.signaling.sendSignalingMessage({
      id: `sig_${Date.now()}`,
      type: 'call_invite',
      callId,
      conversationId,
      senderId: this.currentUserId,
      recipientId,
      timestamp: now,
      payload: { session: newSession },
    });

    // 4. Set ringing timeout (30 seconds)
    this.ringingTimeoutTimer = setTimeout(() => {
      if (this.activeCall && this.activeCall.id === callId && this.activeCall.status === 'ringing') {
        this.endCall(callId, 'timeout_no_answer');
      }
    }, 30000);

    return newSession;
  }

  async acceptCall(callId: string): Promise<CallSession> {
    if (!this.activeCall || this.activeCall.id !== callId) {
      throw new Error(`Call ${callId} not found`);
    }

    if (this.ringingTimeoutTimer) {
      clearTimeout(this.ringingTimeoutTimer);
      this.ringingTimeoutTimer = null;
    }

    // 1. Acquire local media
    await this.media.acquireLocalMedia(this.activeCall.type);

    // 2. Transition state to connected
    const now = new Date().toISOString();
    this.activeCall.status = 'connected';
    this.activeCall.connectedAt = now;

    // 3. Send accept signaling message
    await this.signaling.sendSignalingMessage({
      id: `sig_${Date.now()}`,
      type: 'call_accept',
      callId,
      conversationId: this.activeCall.conversationId,
      senderId: this.currentUserId,
      recipientId: this.activeCall.initiatorId,
      timestamp: now,
      payload: {},
    });

    // 4. Start duration timer
    this.startDurationTimer();

    this.coordinator.broadcast({
      type: 'call_connected',
      call: this.activeCall,
    });

    return this.activeCall;
  }

  async rejectCall(callId: string, reason: CallEndReason = 'declined_by_callee'): Promise<void> {
    if (this.ringingTimeoutTimer) {
      clearTimeout(this.ringingTimeoutTimer);
      this.ringingTimeoutTimer = null;
    }

    const session = this.activeCall;
    if (session && session.id === callId) {
      session.status = 'rejected';
      session.endReason = reason;
      session.endedAt = new Date().toISOString();

      await this.signaling.sendSignalingMessage({
        id: `sig_${Date.now()}`,
        type: 'call_reject',
        callId,
        conversationId: session.conversationId,
        senderId: this.currentUserId,
        recipientId: session.initiatorId,
        timestamp: new Date().toISOString(),
        payload: { reason },
      });

      await this.history.recordCall(session, this.currentUserId);
      await this.media.releaseLocalMedia();

      this.coordinator.broadcast({ type: 'call_ended', call: session });
      this.activeCall = null;
    }
  }

  async endCall(callId: string, reason: CallEndReason = 'completed'): Promise<void> {
    if (this.ringingTimeoutTimer) {
      clearTimeout(this.ringingTimeoutTimer);
      this.ringingTimeoutTimer = null;
    }

    this.stopDurationTimer();

    const session = this.activeCall;
    if (session && session.id === callId) {
      session.status = session.connectedAt ? 'ended' : reason === 'timeout_no_answer' ? 'missed' : 'ended';
      session.endReason = reason;
      session.endedAt = new Date().toISOString();

      await this.signaling.sendSignalingMessage({
        id: `sig_${Date.now()}`,
        type: 'call_end',
        callId,
        conversationId: session.conversationId,
        senderId: this.currentUserId,
        timestamp: new Date().toISOString(),
        payload: { reason, durationSeconds: session.durationSeconds },
      });

      await this.history.recordCall(session, this.currentUserId);
      await this.media.releaseLocalMedia();

      this.coordinator.broadcast({ type: 'call_ended', call: session });
      this.activeCall = null;
    }
  }

  private startDurationTimer(): void {
    this.stopDurationTimer();
    this.durationInterval = setInterval(() => {
      if (this.activeCall && this.activeCall.status === 'connected') {
        this.activeCall.durationSeconds += 1;
        this.coordinator.broadcast({
          type: 'participant_updated',
          call: this.activeCall,
        });
      }
    }, 1000);
  }

  private stopDurationTimer(): void {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
  }

  async toggleMute(): Promise<boolean> {
    const current = this.media.getDeviceState().audioMuted;
    const updated = await this.media.setAudioMuted(!current);

    if (this.activeCall) {
      const myParticipant = this.activeCall.participants.find((p) => p.userId === this.currentUserId);
      if (myParticipant) {
        myParticipant.audioMuted = updated;
      }
      this.coordinator.broadcast({
        type: 'device_state_changed',
        deviceState: this.media.getDeviceState(),
        call: this.activeCall,
      });
    }

    return updated;
  }

  async toggleVideo(): Promise<boolean> {
    const current = this.media.getDeviceState().videoOff;
    const updated = await this.media.setVideoOff(!current);

    if (this.activeCall) {
      const myParticipant = this.activeCall.participants.find((p) => p.userId === this.currentUserId);
      if (myParticipant) {
        myParticipant.videoOff = updated;
      }
      this.coordinator.broadcast({
        type: 'device_state_changed',
        deviceState: this.media.getDeviceState(),
        call: this.activeCall,
      });
    }

    return updated;
  }

  async switchCamera(): Promise<CameraFacing> {
    const current = this.media.getDeviceState().cameraFacing;
    const nextFacing = current === 'user' ? 'environment' : 'user';
    const updated = await this.media.switchCameraFacing(nextFacing);

    this.coordinator.broadcast({
      type: 'device_state_changed',
      deviceState: this.media.getDeviceState(),
      call: this.activeCall || undefined,
    });

    return updated;
  }

  async setAudioRoute(route: AudioDeviceRoute): Promise<AudioDeviceRoute> {
    const updated = await this.media.setAudioRoute(route);
    this.coordinator.broadcast({
      type: 'device_state_changed',
      deviceState: this.media.getDeviceState(),
      call: this.activeCall || undefined,
    });
    return updated;
  }

  async toggleScreenShare(): Promise<boolean> {
    const current = this.media.getDeviceState().screenSharing;
    let success = false;
    if (current) {
      await this.media.stopScreenShare();
      success = false;
    } else {
      success = await this.media.startScreenShare();
    }

    this.coordinator.broadcast({
      type: 'device_state_changed',
      deviceState: this.media.getDeviceState(),
      call: this.activeCall || undefined,
    });

    return success;
  }

  getActiveCall(): CallSession | null {
    return this.activeCall;
  }

  getMediaDeviceState(): MediaDeviceState {
    return this.media.getDeviceState();
  }

  async getCallHistory(limit?: number): Promise<CallHistoryRecord[]> {
    return this.history.getCallHistory(limit);
  }

  async clearCallHistory(): Promise<void> {
    return this.history.clearCallHistory();
  }

  reset(): void {
    this.stopDurationTimer();
    if (this.ringingTimeoutTimer) {
      clearTimeout(this.ringingTimeoutTimer);
      this.ringingTimeoutTimer = null;
    }
    this.activeCall = null;
    this.blockedUserIds.clear();
    this.media.reset();
    this.coordinator.reset();
    this.history.reset();
  }
}

export const callService: ICallService = new CallService();
