/**
 * TikTalk Phase 4: Create Domain Models
 * Clean contracts for camera capture, video upload, editing, drafts, scheduling, and upload state machine
 * Zero fake business data — backend-ready
 */

export type CreateMode = 'hub' | 'camera' | 'upload' | 'edit' | 'details' | 'drafts';

export interface MediaAsset {
  id: string;
  uri: string;
  mimeType: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  fileSizeBytes?: number;
  source: 'camera' | 'gallery' | 'file';
  fileName?: string;
}

export interface CaptionConfig {
  enabled: boolean;
  text: string;
  style: 'classic' | 'neon' | 'bold' | 'minimal';
  position: 'top' | 'center' | 'bottom';
  language?: string;
}

export interface AudioSelection {
  source: 'library' | 'original' | 'upload';
  audioId?: string;
  title?: string;
  artist?: string;
  uri?: string;
  startSeconds?: number;
  durationSeconds?: number;
  volume?: number;
}

export interface CoverConfig {
  source: 'frame' | 'upload' | 'default';
  timestampSeconds?: number;
  imageUri?: string;
}

export interface VideoEditState {
  trimStartSeconds: number;
  trimEndSeconds: number;
  playbackSpeed: 0.5 | 1 | 1.5 | 2;
  isMuted: boolean;
  volume: number; // 0.0 - 1.0
  captionConfig: CaptionConfig;
  audioSelection?: AudioSelection;
  coverConfig: CoverConfig;
}

export interface ScheduleConfig {
  enabled: boolean;
  publishAt?: string; // ISO 8601 string
  timezone?: string;
}

export interface PublishConfig {
  caption: string;
  hashtags: string[];
  mentions: string[];
  audience: 'public' | 'friends' | 'private';
  commentsAllowed: boolean;
  remixAllowed: boolean;
  saveAllowed: boolean;
  schedule: ScheduleConfig;
}

export interface Draft {
  id: string;
  createdAt: string;
  updatedAt: string;
  media: MediaAsset;
  editState: VideoEditState;
  publishConfig: PublishConfig;
}

export type UploadState =
  | 'idle'
  | 'selecting'
  | 'preparing'
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'publishing'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'offline'
  | 'unavailable';

export interface UploadProgressEvent {
  loadedBytes: number;
  totalBytes: number;
  percentage: number;
  step: string;
}

export interface MediaValidationResult {
  isValid: boolean;
  errors: string[];
}
