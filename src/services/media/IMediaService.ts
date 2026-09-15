/**
 * TikTalk Service Boundary: Media Service Contract
 * Interfaces for video uploads, chunking, transcoding status, and audio extraction
 */

import { MediaItem } from '../../domain/media';

export interface UploadProgress {
  bytesUploaded: number;
  totalBytes: number;
  fraction: number;
}

export type UploadProgressCallback = (progress: UploadProgress) => void;

export interface IMediaService {
  uploadVideo(
    fileUri: string,
    onProgress?: UploadProgressCallback
  ): Promise<{ mediaId: string; uploadUrl: string }>;
  getMediaItem(mediaId: string): Promise<MediaItem>;
  extractAudioTrack(videoUri: string): Promise<{ audioId: string; durationSeconds: number }>;
}
