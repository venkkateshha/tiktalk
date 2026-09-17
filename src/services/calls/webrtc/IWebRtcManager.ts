/**
 * TikTalk Service: IWebRtcManager
 * Platform-neutral abstraction for WebRTC peer connection lifecycle,
 * media track management, SDP offer/answer negotiation, and ICE candidate exchange.
 * Keeps browser DOM types encapsulated away from the core domain.
 */

import { CallType } from '../../../domain/call';

export interface WebRtcIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface WebRtcConfig {
  iceServers?: WebRtcIceServer[];
}

/**
 * Resolves default ICE servers.
 * Always preserves the baseline Google STUN server.
 * If EXPO_PUBLIC_TURN_URL is configured in the environment, dynamically appends
 * the TURN relay server along with optional username and credential without hardcoding.
 */
export function resolveDefaultIceServers(): WebRtcIceServer[] {
  const servers: WebRtcIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
  ];

  const turnUrl = process.env.EXPO_PUBLIC_TURN_URL;
  if (turnUrl) {
    const turnServer: WebRtcIceServer = {
      urls: turnUrl,
    };
    if (process.env.EXPO_PUBLIC_TURN_USERNAME) {
      turnServer.username = process.env.EXPO_PUBLIC_TURN_USERNAME;
    }
    if (process.env.EXPO_PUBLIC_TURN_CREDENTIAL) {
      turnServer.credential = process.env.EXPO_PUBLIC_TURN_CREDENTIAL;
    }
    servers.push(turnServer);
  }

  return servers;
}

export interface WebRtcSessionDescription {
  sdp: string;
  type: 'offer' | 'answer';
}

export interface WebRtcIceCandidate {
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
}

export type WebRtcConnectionState =
  | 'new'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'closed';

export interface IWebRtcManager {
  /**
   * Initialize manager with optional custom ICE server configurations
   */
  initialize(config?: WebRtcConfig): void;

  /**
   * Acquire local audio/video media stream matching CallType
   */
  acquireLocalMedia(type: CallType): Promise<unknown>;

  /**
   * Create RTCPeerConnection and attach local media tracks
   */
  createPeerConnection(): void;

  /**
   * Caller flow: generate WebRTC SDP offer
   */
  createOffer(): Promise<WebRtcSessionDescription>;

  /**
   * Callee flow: generate WebRTC SDP answer
   */
  createAnswer(): Promise<WebRtcSessionDescription>;

  /**
   * Apply remote SDP session description (offer on callee, answer on caller)
   */
  setRemoteDescription(desc: WebRtcSessionDescription): Promise<void>;

  /**
   * Add received remote ICE candidate (queued if remote description not yet set)
   */
  addIceCandidate(candidate: WebRtcIceCandidate): Promise<void>;

  /**
   * Register callback fired when local ICE candidates are gathered
   */
  onLocalIceCandidate(callback: (candidate: WebRtcIceCandidate) => void): void;

  /**
   * Register callback fired when remote audio/video tracks are received
   */
  onRemoteStream(callback: (stream: unknown) => void): void;

  /**
   * Register callback fired when peer connection state changes
   */
  onConnectionStateChange(callback: (state: WebRtcConnectionState) => void): void;

  /**
   * Mute or unmute local audio tracks
   */
  setAudioMuted(muted: boolean): boolean;

  /**
   * Turn local video track on or off
   */
  setVideoOff(off: boolean): boolean;

  /**
   * Get active local MediaStream
   */
  getLocalStream(): unknown;

  /**
   * Get active remote MediaStream
   */
  getRemoteStream(): unknown;

  /**
   * Current peer connection state
   */
  getConnectionState(): WebRtcConnectionState;

  /**
   * Release media tracks, close peer connection, and flush candidate buffers
   */
  cleanup(): void;
}
