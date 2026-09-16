/**
 * TikTalk Service Boundary: Media Provider & WebRTC Transport Contract
 * Provider-independent abstraction for media acquisition, track management,
 * device routing (microphones, cameras, speakers), and quality metrics.
 */

import {
  CallType,
  CameraFacing,
  AudioDeviceRoute,
  MediaDeviceState,
  CallQualityStats,
} from '../../domain/call';

export interface IMediaProvider {
  /**
   * Acquire local camera/microphone tracks according to call type
   */
  acquireLocalMedia(type: CallType): Promise<MediaDeviceState>;

  /**
   * Release and cleanly stop all active media tracks
   */
  releaseLocalMedia(): Promise<void>;

  /**
   * Toggle microphone state
   */
  setAudioMuted(muted: boolean): Promise<boolean>;

  /**
   * Toggle video track state
   */
  setVideoOff(off: boolean): Promise<boolean>;

  /**
   * Switch between front ('user') and back ('environment') camera
   */
  switchCameraFacing(facing: CameraFacing): Promise<CameraFacing>;

  /**
   * Route audio to speaker, earpiece, bluetooth, or headphones
   */
  setAudioRoute(route: AudioDeviceRoute): Promise<AudioDeviceRoute>;

  /**
   * Start screen sharing (Web desktop only where supported)
   */
  startScreenShare(): Promise<boolean>;

  /**
   * Stop screen sharing
   */
  stopScreenShare(): Promise<void>;

  /**
   * Get current media device state
   */
  getDeviceState(): MediaDeviceState;

  /**
   * Get WebRTC quality statistics (latency, jitter, packet loss, bitrate)
   */
  getQualityStats(): Promise<CallQualityStats>;

  /**
   * Attach local stream to target video element/ref
   */
  attachLocalStream(element: unknown): void;

  /**
   * Attach remote stream to target video element/ref
   */
  attachRemoteStream(userId: string, element: unknown): void;
}
