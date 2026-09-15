import {
  MediaAsset,
  MediaValidationResult,
  Draft,
  ScheduleConfig,
  UploadProgressEvent,
} from '../types';

export interface UploadPreparationResult {
  uploadUrl: string;
  uploadId: string;
  expiresAt: string;
}

export interface UploadResult {
  assetId: string;
  mediaUrl: string;
  thumbnailUrl?: string;
}

export interface PublishResult {
  postId: string;
  status: 'published' | 'scheduled' | 'processing';
  publishedAt?: string;
  scheduledAt?: string;
}

export interface IMediaService {
  pickVideo(options?: { maxDurationSeconds?: number }): Promise<MediaAsset | null>;

  captureVideo(options?: { durationSeconds?: number }): Promise<MediaAsset | null>;

  validateMedia(asset: MediaAsset): MediaValidationResult;

  prepareUpload(asset: MediaAsset, signal?: AbortSignal): Promise<UploadPreparationResult>;

  upload(
    asset: MediaAsset,
    onProgress?: (progress: UploadProgressEvent) => void,
    signal?: AbortSignal
  ): Promise<UploadResult>;

  cancelUpload(): void;

  saveDraft(draft: Draft): Promise<Draft>;

  getDrafts(): Promise<Draft[]>;

  getDraftById(id: string): Promise<Draft | null>;

  deleteDraft(id: string): Promise<void>;

  publish(draft: Draft, signal?: AbortSignal): Promise<PublishResult>;

  schedule(
    draft: Draft,
    scheduleConfig: ScheduleConfig,
    signal?: AbortSignal
  ): Promise<PublishResult>;
}
