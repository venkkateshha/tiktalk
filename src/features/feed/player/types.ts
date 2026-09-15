/**
 * TikTalk Video Player Abstraction Architecture
 * Cross-platform interface for Android (ExoPlayer), iOS (AVPlayer), and Web
 */

export interface PlaybackStatus {
  isPlaying: boolean;
  isMuted: boolean;
  isBuffering: boolean;
  positionMillis: number;
  durationMillis: number;
  didJustFinish: boolean;
}

export interface IVideoPlayer {
  play(): Promise<void>;
  pause(): Promise<void>;
  setMuted(muted: boolean): Promise<void>;
  seekTo(positionMillis: number): Promise<void>;
  getStatus(): PlaybackStatus;
  release(): Promise<void>;
}

export interface VideoPlayerProps {
  mediaUrl?: string;
  thumbnailUrl?: string;
  isActive: boolean;
  isMuted: boolean;
  isPlaying?: boolean;
  onTogglePlayPause?: () => void;
  onToggleMute?: () => void;
  onPlaybackStatusUpdate?: (status: PlaybackStatus) => void;
  accessibilityDescription?: string;
}
