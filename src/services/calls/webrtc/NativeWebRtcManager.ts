/**
 * TikTalk Service: NativeWebRtcManager
 * Production implementation of IWebRtcManager for Android platforms.
 * Wraps react-native-webrtc@124.0.8 behind the platform-neutral IWebRtcManager contract.
 * Manages native peer connection lifecycle, hardware media capture,
 * permission verification, candidate queueing, and track toggles.
 */

import { Platform, PermissionsAndroid } from 'react-native';
import { CallType } from '../../../domain/call';
import {
  IWebRtcManager,
  WebRtcConfig,
  WebRtcSessionDescription,
  WebRtcIceCandidate,
  WebRtcConnectionState,
  resolveDefaultIceServers,
} from './IWebRtcManager';

function resolveNativeWebRtcModule(): any {
  if (Platform.OS === 'android') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require('react-native-webrtc');
    } catch (error) {
      console.warn('[NativeWebRtcManager] Failed to load react-native-webrtc:', error);
      return null;
    }
  }
  return null;
}

export class NativeWebRtcManager implements IWebRtcManager {
  private config: WebRtcConfig = {
    iceServers: resolveDefaultIceServers(),
  };

  private webrtcModule: any;
  private peerConnection: any = null;
  private localStream: any = null;
  private remoteStream: any = null;
  private queuedIceCandidates: WebRtcIceCandidate[] = [];

  private localIceCandidateCallback?: (candidate: WebRtcIceCandidate) => void;
  private remoteStreamCallback?: (stream: unknown) => void;
  private connectionStateCallback?: (state: WebRtcConnectionState) => void;

  constructor(customModule?: any) {
    this.webrtcModule = customModule !== undefined ? customModule : resolveNativeWebRtcModule();
  }

  initialize(config?: WebRtcConfig): void {
    if (config?.iceServers) {
      this.config = { ...config };
    }
  }

  async acquireLocalMedia(type: CallType): Promise<unknown> {
    // 1. Android runtime permission verification
    if (Platform.OS === 'android') {
      const permissionsToRequest: any[] = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
      if (type === 'video') {
        permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.CAMERA);
      }

      try {
        const results = await PermissionsAndroid.requestMultiple(permissionsToRequest);
        const audioGranted =
          results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
          PermissionsAndroid.RESULTS.GRANTED;
        const videoGranted =
          type === 'video'
            ? results[PermissionsAndroid.PERMISSIONS.CAMERA] ===
              PermissionsAndroid.RESULTS.GRANTED
            : true;

        if (!audioGranted || !videoGranted) {
          const permError = new Error('Permission denied for media devices');
          permError.name = 'NotAllowedError';
          throw permError;
        }
      } catch (err: any) {
        if (err?.name === 'NotAllowedError') {
          throw err;
        }
        console.warn('[NativeWebRtcManager] Android permission request error:', err);
      }
    }

    const mod = this.webrtcModule || resolveNativeWebRtcModule();
    if (!mod || !mod.mediaDevices) {
      console.warn('[NativeWebRtcManager] react-native-webrtc mediaDevices is not available');
      return null;
    }

    const constraints = {
      audio: true,
      video: type === 'video' ? { facingMode: 'user' } : false,
    };

    try {
      const stream = await mod.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      return stream;
    } catch (error: any) {
      console.warn('[NativeWebRtcManager] getUserMedia failed:', error);
      throw error;
    }
  }

  createPeerConnection(): void {
    if (this.peerConnection) {
      this.cleanupPeerConnectionOnly();
    }

    const mod = this.webrtcModule || resolveNativeWebRtcModule();
    if (!mod || !mod.RTCPeerConnection) {
      console.warn('[NativeWebRtcManager] RTCPeerConnection constructor not available');
      return;
    }

    const RTCPC = mod.RTCPeerConnection;
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
          console.warn('[NativeWebRtcManager] Error adding track to peerConnection:', err);
        }
      });
    }

    // 2. Setup local ICE gathering handler
    this.peerConnection.onicecandidate = (event: any) => {
      if (event?.candidate && this.localIceCandidateCallback) {
        this.localIceCandidateCallback({
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
        });
      }
    };

    // 3. Setup remote track handler
    this.peerConnection.ontrack = (event: any) => {
      if (event?.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
      } else if (mod.MediaStream) {
        if (!this.remoteStream) {
          this.remoteStream = new mod.MediaStream();
        }
        if (event?.track) {
          this.remoteStream.addTrack(event.track);
        }
      }

      if (this.remoteStreamCallback && this.remoteStream) {
        this.remoteStreamCallback(this.remoteStream);
      }
    };

    // 4. Setup connection state handler
    const updateState = () => {
      const rawState =
        this.peerConnection?.connectionState ||
        this.peerConnection?.iceConnectionState ||
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

    const mod = this.webrtcModule || resolveNativeWebRtcModule();
    const RTCSessionDesc = mod?.RTCSessionDescription;
    const sessionDesc = RTCSessionDesc ? new RTCSessionDesc(desc) : desc;
    await this.peerConnection.setRemoteDescription(sessionDesc);

    await this.flushQueuedIceCandidates();
  }

  async addIceCandidate(candidate: WebRtcIceCandidate): Promise<void> {
    if (
      !this.peerConnection ||
      !this.peerConnection.remoteDescription ||
      !this.peerConnection.remoteDescription.type
    ) {
      this.queuedIceCandidates.push(candidate);
      return;
    }

    const mod = this.webrtcModule || resolveNativeWebRtcModule();
    const RTCIce = mod?.RTCIceCandidate;
    const iceCandidate = RTCIce ? new RTCIce(candidate) : candidate;

    try {
      await this.peerConnection.addIceCandidate(iceCandidate);
    } catch (err) {
      console.warn('[NativeWebRtcManager] Failed to add ICE candidate:', err);
    }
  }

  private async flushQueuedIceCandidates(): Promise<void> {
    if (!this.peerConnection || this.queuedIceCandidates.length === 0) return;

    const mod = this.webrtcModule || resolveNativeWebRtcModule();
    const RTCIce = mod?.RTCIceCandidate;
    const queue = [...this.queuedIceCandidates];
    this.queuedIceCandidates = [];

    for (const item of queue) {
      try {
        const ice = RTCIce ? new RTCIce(item) : item;
        await this.peerConnection.addIceCandidate(ice);
      } catch (err) {
        console.warn('[NativeWebRtcManager] Error adding queued candidate:', err);
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
    if (this.localStream && typeof this.localStream.getTracks === 'function') {
      this.localStream.getTracks().forEach((track: any) => {
        try {
          track.stop();
        } catch {}
      });
      this.localStream = null;
    }

    this.cleanupPeerConnectionOnly();
  }

  private mapConnectionState(raw: string): WebRtcConnectionState {
    switch (raw?.toLowerCase()) {
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

export const nativeWebRtcManager = new NativeWebRtcManager();
