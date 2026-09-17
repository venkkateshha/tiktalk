/**
 * TikTalk Service: WebWebRtcManager
 * Production implementation of IWebRtcManager for Web platforms.
 * Leverages native browser WebRTC APIs (RTCPeerConnection, getUserMedia, MediaStream).
 * Handles candidate queueing, connection state monitoring, track toggles, and clean teardown.
 */

import { Platform } from 'react-native';
import { CallType } from '../../../domain/call';
import {
  IWebRtcManager,
  WebRtcConfig,
  WebRtcSessionDescription,
  WebRtcIceCandidate,
  WebRtcConnectionState,
  resolveDefaultIceServers,
} from './IWebRtcManager';

export class WebWebRtcManager implements IWebRtcManager {
  private config: WebRtcConfig = {
    iceServers: resolveDefaultIceServers(),
  };

  private peerConnection: any = null;
  private localStream: any = null;
  private remoteStream: any = null;
  private queuedIceCandidates: WebRtcIceCandidate[] = [];

  private localIceCandidateCallback?: (candidate: WebRtcIceCandidate) => void;
  private remoteStreamCallback?: (stream: unknown) => void;
  private connectionStateCallback?: (state: WebRtcConnectionState) => void;

  initialize(config?: WebRtcConfig): void {
    if (config?.iceServers) {
      this.config = { ...config };
    }
  }

  async acquireLocalMedia(type: CallType): Promise<unknown> {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      const constraints = {
        audio: true,
        video: type === 'video' ? { facingMode: 'user' } : false,
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.localStream = stream;
        return stream;
      } catch (error) {
        console.warn('[WebWebRtcManager] getUserMedia failed or permission denied:', error);
        throw error;
      }
    }

    return null;
  }

  createPeerConnection(): void {
    if (this.peerConnection) {
      this.cleanupPeerConnectionOnly();
    }

    const RTCPC = this.getRTCPeerConnectionConstructor();
    if (!RTCPC) {
      console.warn('[WebWebRtcManager] RTCPeerConnection not supported in this environment');
      return;
    }

    this.peerConnection = new RTCPC({
      iceServers: this.config.iceServers,
    });

    // 1. Attach existing local media tracks
    if (this.localStream && typeof this.localStream.getTracks === 'function') {
      this.localStream.getTracks().forEach((track: any) => {
        try {
          if (this.peerConnection.addTrack) {
            this.peerConnection.addTrack(track, this.localStream);
          }
        } catch (err) {
          console.warn('[WebWebRtcManager] Error adding track to peerConnection:', err);
        }
      });
    }

    // 2. Setup local ICE gathering handler
    this.peerConnection.onicecandidate = (event: any) => {
      if (event.candidate && this.localIceCandidateCallback) {
        this.localIceCandidateCallback({
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
        });
      }
    };

    // 3. Setup remote track handler
    this.peerConnection.ontrack = (event: any) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
      } else {
        const MediaStreamCtor = this.getMediaStreamConstructor();
        if (MediaStreamCtor) {
          if (!this.remoteStream) {
            this.remoteStream = new MediaStreamCtor();
          }
          if (event.track) {
            this.remoteStream.addTrack(event.track);
          }
        }
      }

      if (this.remoteStreamCallback && this.remoteStream) {
        this.remoteStreamCallback(this.remoteStream);
      }
    };

    // 4. Setup connection state handler
    const updateState = () => {
      const rawState =
        this.peerConnection.connectionState ||
        this.peerConnection.iceConnectionState ||
        'new';
      const mappedState = this.mapConnectionState(rawState);
      if (this.connectionStateCallback) {
        this.connectionStateCallback(mappedState);
      }
    };

    this.peerConnection.onconnectionstatechange = updateState;
    this.peerConnection.oniceconnectionstatechange = updateState;
  }

  async createOffer(): Promise<WebRtcSessionDescription> {
    if (!this.peerConnection) {
      this.createPeerConnection();
    }

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    return {
      sdp: offer.sdp,
      type: 'offer',
    };
  }

  async createAnswer(): Promise<WebRtcSessionDescription> {
    if (!this.peerConnection) {
      throw new Error('Cannot create answer without an active peer connection');
    }

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    return {
      sdp: answer.sdp,
      type: 'answer',
    };
  }

  async setRemoteDescription(desc: WebRtcSessionDescription): Promise<void> {
    if (!this.peerConnection) {
      this.createPeerConnection();
    }

    const RTCSessionDesc = this.getRTCSessionDescriptionConstructor();
    const sessionDesc = RTCSessionDesc ? new RTCSessionDesc(desc) : desc;
    await this.peerConnection.setRemoteDescription(sessionDesc);

    // Flush any queued ICE candidates that arrived before remote description was ready
    await this.flushQueuedIceCandidates();
  }

  async addIceCandidate(candidate: WebRtcIceCandidate): Promise<void> {
    if (
      !this.peerConnection ||
      !this.peerConnection.remoteDescription ||
      !this.peerConnection.remoteDescription.type
    ) {
      // Queue candidate until remote description is applied
      this.queuedIceCandidates.push(candidate);
      return;
    }

    const RTCIce = this.getRTCIceCandidateConstructor();
    const iceCandidate = RTCIce ? new RTCIce(candidate) : candidate;

    try {
      await this.peerConnection.addIceCandidate(iceCandidate);
    } catch (err) {
      console.warn('[WebWebRtcManager] Failed to add ICE candidate:', err);
    }
  }

  private async flushQueuedIceCandidates(): Promise<void> {
    if (!this.peerConnection || this.queuedIceCandidates.length === 0) return;

    const RTCIce = this.getRTCIceCandidateConstructor();
    const queue = [...this.queuedIceCandidates];
    this.queuedIceCandidates = [];

    for (const item of queue) {
      try {
        const ice = RTCIce ? new RTCIce(item) : item;
        await this.peerConnection.addIceCandidate(ice);
      } catch (err) {
        console.warn('[WebWebRtcManager] Error adding queued candidate:', err);
      }
    }
  }

  onLocalIceCandidate(callback: (candidate: WebRtcIceCandidate) => void): void {
    this.localIceCandidateCallback = callback;
  }

  onRemoteStream(callback: (stream: unknown) => void): void {
    this.remoteStreamCallback = callback;
    if (this.remoteStream) {
      callback(this.remoteStream);
    }
  }

  onConnectionStateChange(callback: (state: WebRtcConnectionState) => void): void {
    this.connectionStateCallback = callback;
  }

  setAudioMuted(muted: boolean): boolean {
    if (this.localStream && typeof this.localStream.getAudioTracks === 'function') {
      this.localStream.getAudioTracks().forEach((track: any) => {
        track.enabled = !muted;
      });
    }
    return muted;
  }

  setVideoOff(off: boolean): boolean {
    if (this.localStream && typeof this.localStream.getVideoTracks === 'function') {
      this.localStream.getVideoTracks().forEach((track: any) => {
        track.enabled = !off;
      });
    }
    return off;
  }

  getLocalStream(): unknown {
    return this.localStream;
  }

  getRemoteStream(): unknown {
    return this.remoteStream;
  }

  getConnectionState(): WebRtcConnectionState {
    if (!this.peerConnection) return 'new';
    return this.mapConnectionState(
      this.peerConnection.connectionState ||
      this.peerConnection.iceConnectionState ||
      'new'
    );
  }

  private cleanupPeerConnectionOnly(): void {
    if (this.peerConnection) {
      try {
        this.peerConnection.onicecandidate = null;
        this.peerConnection.ontrack = null;
        this.peerConnection.onconnectionstatechange = null;
        this.peerConnection.oniceconnectionstatechange = null;
        this.peerConnection.close();
      } catch {}
      this.peerConnection = null;
    }
    this.queuedIceCandidates = [];
    this.remoteStream = null;
  }

  cleanup(): void {
    // 1. Stop local media tracks
    if (this.localStream && typeof this.localStream.getTracks === 'function') {
      this.localStream.getTracks().forEach((track: any) => {
        try {
          track.stop();
        } catch {}
      });
      this.localStream = null;
    }

    // 2. Teardown peer connection and candidate queue
    this.cleanupPeerConnectionOnly();
  }

  // Safe global constructors resolution
  private getRTCPeerConnectionConstructor(): any {
    if (typeof RTCPeerConnection !== 'undefined') return RTCPeerConnection;
    if (typeof window !== 'undefined' && (window as any).RTCPeerConnection) {
      return (window as any).RTCPeerConnection;
    }
    if (typeof globalThis !== 'undefined' && (globalThis as any).RTCPeerConnection) {
      return (globalThis as any).RTCPeerConnection;
    }
    return null;
  }

  private getRTCSessionDescriptionConstructor(): any {
    if (typeof RTCSessionDescription !== 'undefined') return RTCSessionDescription;
    if (typeof window !== 'undefined' && (window as any).RTCSessionDescription) {
      return (window as any).RTCSessionDescription;
    }
    if (typeof globalThis !== 'undefined' && (globalThis as any).RTCSessionDescription) {
      return (globalThis as any).RTCSessionDescription;
    }
    return null;
  }

  private getRTCIceCandidateConstructor(): any {
    if (typeof RTCIceCandidate !== 'undefined') return RTCIceCandidate;
    if (typeof window !== 'undefined' && (window as any).RTCIceCandidate) {
      return (window as any).RTCIceCandidate;
    }
    if (typeof globalThis !== 'undefined' && (globalThis as any).RTCIceCandidate) {
      return (globalThis as any).RTCIceCandidate;
    }
    return null;
  }

  private getMediaStreamConstructor(): any {
    if (typeof MediaStream !== 'undefined') return MediaStream;
    if (typeof window !== 'undefined' && (window as any).MediaStream) {
      return (window as any).MediaStream;
    }
    if (typeof globalThis !== 'undefined' && (globalThis as any).MediaStream) {
      return (globalThis as any).MediaStream;
    }
    return null;
  }

  private mapConnectionState(raw: string): WebRtcConnectionState {
    switch (raw.toLowerCase()) {
      case 'connected':
      case 'completed':
        return 'connected';
      case 'connecting':
      case 'checking':
        return 'connecting';
      case 'disconnected':
        return 'disconnected';
      case 'failed':
        return 'failed';
      case 'closed':
        return 'closed';
      default:
        return 'new';
    }
  }
}

export const webWebRtcManager = new WebWebRtcManager();
