/**
 * TikTalk Service Boundary: Call Service Contract
 * Core interface for voice & video call session management,
 * call controls, device toggles, history persistence, and safety rules.
 */

import {
  CallSession,
  CallType,
  CallEndReason,
  AudioDeviceRoute,
  CameraFacing,
  MediaDeviceState,
  CallHistoryRecord,
} from '../../domain/call';

export interface ICallService {
  /**
   * Initiate a new 1:1 or group voice/video call
   */
  startCall(conversationId: string, type: CallType, recipientId?: string): Promise<CallSession>;

  /**
   * Accept an incoming call session
   */
  acceptCall(callId: string): Promise<CallSession>;

  /**
   * Decline an incoming call session
   */
  rejectCall(callId: string, reason?: CallEndReason): Promise<void>;

  /**
   * Terminate an active or connecting call
   */
  endCall(callId: string, reason?: CallEndReason): Promise<void>;

  /**
   * Toggle local microphone mute state
   */
  toggleMute(): Promise<boolean>;

  /**
   * Toggle local video camera state
   */
  toggleVideo(): Promise<boolean>;

  /**
   * Switch between front and back camera
   */
  switchCamera(): Promise<CameraFacing>;

  /**
   * Switch audio output route
   */
  setAudioRoute(route: AudioDeviceRoute): Promise<AudioDeviceRoute>;

  /**
   * Toggle screen sharing (desktop Web only)
   */
  toggleScreenShare(): Promise<boolean>;

  /**
   * Get currently active or pending call session
   */
  getActiveCall(): CallSession | null;

  /**
   * Get device media state (mic, cam, route)
   */
  getMediaDeviceState(): MediaDeviceState;

  /**
   * Fetch persistent call history records
   */
  getCallHistory(limit?: number): Promise<CallHistoryRecord[]>;

  /**
   * Clear call history
   */
  clearCallHistory(): Promise<void>;
}
