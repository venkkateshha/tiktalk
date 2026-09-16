/**
 * TikTalk Domain: Voice & Video Calling
 * Production-ready typed contracts for 1:1 and group voice/video calls,
 * signaling state machine, media device routing, participants, and call history.
 * ZERO fake business data.
 */

import { User } from './user';

export type CallType = 'audio' | 'video';

export type CallStatus =
  | 'idle'
  | 'initiating'
  | 'ringing'
  | 'connected'
  | 'reconnecting'
  | 'ended'
  | 'rejected'
  | 'busy'
  | 'missed'
  | 'failed';

export type CallEndReason =
  | 'completed'
  | 'cancelled_by_caller'
  | 'declined_by_callee'
  | 'callee_busy'
  | 'timeout_no_answer'
  | 'network_disconnected'
  | 'media_error'
  | 'caller_blocked'
  | 'permission_denied';

export type AudioDeviceRoute = 'speaker' | 'earpiece' | 'bluetooth' | 'headphones';

export type CameraFacing = 'user' | 'environment';

export interface MediaDeviceState {
  audioMuted: boolean;
  videoOff: boolean;
  cameraFacing: CameraFacing;
  audioRoute: AudioDeviceRoute;
  screenSharing: boolean;
  hasAudioPermission: boolean;
  hasVideoPermission: boolean;
}

export interface CallParticipant {
  userId: string;
  user?: User;
  role: 'caller' | 'callee' | 'host' | 'member';
  audioMuted: boolean;
  videoOff: boolean;
  isSpeaking: boolean;
  audioLevel?: number; // 0.0 to 1.0 normalized
  joinedAt: string;
  leftAt?: string;
  streamId?: string;
}

export interface CallSession {
  id: string;
  conversationId: string;
  type: CallType;
  status: CallStatus;
  initiatorId: string;
  initiator?: User;
  participants: CallParticipant[];
  isGroup: boolean;
  groupTitle?: string;
  startedAt: string;
  connectedAt?: string;
  endedAt?: string;
  durationSeconds: number;
  endReason?: CallEndReason;
  metadata?: Record<string, unknown>;
}

export interface CallHistoryRecord {
  id: string;
  callSessionId: string;
  conversationId: string;
  type: CallType;
  direction: 'incoming' | 'outgoing';
  status: CallStatus;
  durationSeconds: number;
  participants: {
    userId: string;
    displayName: string;
    username: string;
    avatarUrl?: string;
  }[];
  timestamp: string;
  endReason: CallEndReason;
}

// Realtime Signaling Message Types
export type SignalingMessageType =
  | 'call_invite'
  | 'call_ringing'
  | 'call_accept'
  | 'call_reject'
  | 'call_busy'
  | 'call_cancel'
  | 'call_end'
  | 'webrtc_offer'
  | 'webrtc_answer'
  | 'ice_candidate'
  | 'media_state_change'
  | 'participant_joined'
  | 'participant_left';

export interface SignalingMessage<T = unknown> {
  id: string;
  type: SignalingMessageType;
  callId: string;
  conversationId: string;
  senderId: string;
  recipientId?: string; // Optional for 1:1, omitted for group broadcast
  timestamp: string;
  payload: T;
}

export interface WebRtcOfferPayload {
  sdp: string;
  type: 'offer';
}

export interface WebRtcAnswerPayload {
  sdp: string;
  type: 'answer';
}

export interface IceCandidatePayload {
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
}

export interface MediaStateChangePayload {
  userId: string;
  audioMuted?: boolean;
  videoOff?: boolean;
  screenSharing?: boolean;
}

export interface CallQualityStats {
  latencyMs: number;
  jitterMs: number;
  packetLossPercent: number;
  bitrateKbps: number;
  resolution?: { width: number; height: number };
  audioLevel: number;
}
