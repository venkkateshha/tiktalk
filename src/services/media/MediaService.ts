/**
 * TikTalk Service Boundary: Baseline Media Service Implementation
 */

import { IMediaService, UploadProgressCallback } from './IMediaService';
import { MediaItem } from '../../domain/media';
import { IApiClient, apiClient } from '../api';

export class MediaService implements IMediaService {
  private client: IApiClient;

  constructor(client: IApiClient = apiClient) {
    this.client = client;
  }

  async uploadVideo(
    fileUri: string,
    onProgress?: UploadProgressCallback
  ): Promise<{ mediaId: string; uploadUrl: string }> {
    // Media upload boundary with progress notification
    onProgress?.({ bytesUploaded: 100, totalBytes: 100, fraction: 1.0 });
    const res = await this.client.post<{ mediaId: string; uploadUrl: string }>('/media/upload-ticket', {
      fileUri,
    });
    return res.data;
  }

  async getMediaItem(mediaId: string): Promise<MediaItem> {
    const res = await this.client.get<MediaItem>(`/media/${mediaId}`);
    return res.data;
  }

  async extractAudioTrack(videoUri: string): Promise<{ audioId: string; durationSeconds: number }> {
    const res = await this.client.post<{ audioId: string; durationSeconds: number }>(
      '/media/extract-audio',
      { videoUri }
    );
    return res.data;
  }
}

export const mediaService: IMediaService = new MediaService();
