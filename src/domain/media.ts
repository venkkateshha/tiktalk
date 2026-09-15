/**
 * TikTalk Domain: Media & Assets
 * Clean contracts for video playback, transcoding levels, and audio tracks
 */

export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:5';

export interface VideoResolution {
  width: number;
  height: number;
  bitrate: number;
  fps: number;
  codec: 'h264' | 'h265' | 'av1';
}

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  durationSeconds: number;
  audioUrl: string;
  waveformUrl?: string;
  isOriginalSound: boolean;
  creatorId?: string;
}

export interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl: string;
  aspectRatio: AspectRatio;
  durationSeconds: number;
  resolutions: VideoResolution[];
  audioTrack?: AudioTrack;
}
