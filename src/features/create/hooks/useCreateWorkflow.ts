import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CreateMode,
  MediaAsset,
  VideoEditState,
  PublishConfig,
  UploadState,
  UploadProgressEvent,
  Draft,
} from '../types';
import { IMediaService, mediaService } from '../service';

export interface UseCreateWorkflowReturn {
  mode: CreateMode;
  selectedAsset: MediaAsset | null;
  editState: VideoEditState;
  publishConfig: PublishConfig;
  uploadState: UploadState;
  uploadProgress: UploadProgressEvent | null;
  errorMessage: string | null;
  drafts: Draft[];
  activeDraftId: string | null;
  goToHub: () => void;
  startCamera: () => void;
  pickFromGallery: () => Promise<void>;
  proceedToEdit: (asset: MediaAsset) => void;
  proceedToDetails: () => void;
  backToEdit: () => void;
  showDrafts: () => void;
  updateEditState: (updater: Partial<VideoEditState>) => void;
  updatePublishConfig: (updater: Partial<PublishConfig>) => void;
  saveCurrentDraft: () => Promise<Draft | null>;
  resumeDraft: (draft: Draft) => void;
  deleteDraft: (id: string) => Promise<void>;
  publishCurrent: () => Promise<void>;
  cancelUpload: () => void;
  resetWorkflow: () => void;
}

const DEFAULT_EDIT_STATE: VideoEditState = {
  trimStartSeconds: 0,
  trimEndSeconds: 15,
  playbackSpeed: 1,
  isMuted: false,
  volume: 1.0,
  captionConfig: {
    enabled: false,
    text: '',
    style: 'classic',
    position: 'bottom',
  },
  coverConfig: {
    source: 'default',
  },
};

const DEFAULT_PUBLISH_CONFIG: PublishConfig = {
  caption: '',
  hashtags: [],
  mentions: [],
  audience: 'public',
  commentsAllowed: true,
  remixAllowed: true,
  saveAllowed: true,
  schedule: {
    enabled: false,
  },
};

export function useCreateWorkflow(
  service: IMediaService = mediaService
): UseCreateWorkflowReturn {
  const [mode, setMode] = useState<CreateMode>('hub');
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [editState, setEditState] = useState<VideoEditState>(DEFAULT_EDIT_STATE);
  const [publishConfig, setPublishConfig] = useState<PublishConfig>(DEFAULT_PUBLISH_CONFIG);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState<UploadProgressEvent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load existing drafts on mount
  const loadDrafts = useCallback(async () => {
    try {
      const items = await service.getDrafts();
      setDrafts(items);
    } catch {
      setDrafts([]);
    }
  }, [service]);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  const goToHub = useCallback(() => {
    setMode('hub');
    setErrorMessage(null);
  }, []);

  const startCamera = useCallback(() => {
    setMode('camera');
    setErrorMessage(null);
  }, []);

  const proceedToEdit = useCallback((asset: MediaAsset) => {
    setSelectedAsset(asset);
    setEditState({
      ...DEFAULT_EDIT_STATE,
      trimStartSeconds: 0,
      trimEndSeconds: asset.durationSeconds || 15,
    });
    setMode('edit');
    setErrorMessage(null);
  }, []);

  const pickFromGallery = useCallback(async () => {
    setErrorMessage(null);
    try {
      const asset = await service.pickVideo();
      if (asset) {
        const validation = service.validateMedia(asset);
        if (!validation.isValid) {
          setErrorMessage(validation.errors.join(' '));
          return;
        }
        proceedToEdit(asset);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to select video.');
    }
  }, [service, proceedToEdit]);

  const proceedToDetails = useCallback(() => {
    setMode('details');
  }, []);

  const backToEdit = useCallback(() => {
    setMode('edit');
  }, []);

  const showDrafts = useCallback(() => {
    loadDrafts();
    setMode('drafts');
  }, [loadDrafts]);

  const updateEditState = useCallback((updater: Partial<VideoEditState>) => {
    setEditState((prev) => ({ ...prev, ...updater }));
  }, []);

  const updatePublishConfig = useCallback((updater: Partial<PublishConfig>) => {
    setPublishConfig((prev) => ({ ...prev, ...updater }));
  }, []);

  const saveCurrentDraft = useCallback(async (): Promise<Draft | null> => {
    if (!selectedAsset) return null;

    const draftToSave: Draft = {
      id: activeDraftId || `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      media: selectedAsset,
      editState,
      publishConfig,
    };

    try {
      const saved = await service.saveDraft(draftToSave);
      setActiveDraftId(saved.id);
      await loadDrafts();
      return saved;
    } catch {
      return null;
    }
  }, [selectedAsset, activeDraftId, editState, publishConfig, service, loadDrafts]);

  const resumeDraft = useCallback((draft: Draft) => {
    setActiveDraftId(draft.id);
    setSelectedAsset(draft.media);
    setEditState(draft.editState || DEFAULT_EDIT_STATE);
    setPublishConfig(draft.publishConfig || DEFAULT_PUBLISH_CONFIG);
    setMode('edit');
  }, []);

  const deleteDraft = useCallback(
    async (id: string) => {
      await service.deleteDraft(id);
      if (activeDraftId === id) {
        setActiveDraftId(null);
      }
      await loadDrafts();
    },
    [service, activeDraftId, loadDrafts]
  );

  const publishCurrent = useCallback(async () => {
    if (!selectedAsset) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setUploadState('preparing');
    setErrorMessage(null);

    const currentDraft: Draft = {
      id: activeDraftId || `draft_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      media: selectedAsset,
      editState,
      publishConfig,
    };

    try {
      setUploadState('uploading');
      await service.upload(
        selectedAsset,
        (progress) => {
          setUploadProgress(progress);
        },
        controller.signal
      );

      setUploadState('processing');

      if (publishConfig.schedule.enabled) {
        setUploadState('publishing');
        await service.schedule(currentDraft, publishConfig.schedule, controller.signal);
      } else {
        setUploadState('publishing');
        await service.publish(currentDraft, controller.signal);
      }

      setUploadState('success');
      setTimeout(() => {
        resetWorkflow();
      }, 1500);
    } catch (err: any) {
      if (controller.signal.aborted) {
        setUploadState('cancelled');
        return;
      }
      const isOffline =
        (err instanceof Error && err.message.toLowerCase().includes('offline')) ||
        (typeof navigator !== 'undefined' && !navigator.onLine);

      if (isOffline) {
        setUploadState('offline');
        setErrorMessage('No Internet Connection. Upload will resume when reconnected.');
      } else if (err.status === 503 || err.message?.includes('unavailable')) {
        setUploadState('unavailable');
        setErrorMessage('Video streaming ingestion edge is currently undergoing maintenance.');
      } else {
        setUploadState('failed');
        setErrorMessage(err.message || 'Upload failed. Please try again.');
      }
    }
  }, [selectedAsset, activeDraftId, editState, publishConfig, service]);

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    service.cancelUpload();
    setUploadState('cancelled');
  }, [service]);

  const resetWorkflow = useCallback(() => {
    setMode('hub');
    setSelectedAsset(null);
    setEditState(DEFAULT_EDIT_STATE);
    setPublishConfig(DEFAULT_PUBLISH_CONFIG);
    setUploadState('idle');
    setUploadProgress(null);
    setErrorMessage(null);
    setActiveDraftId(null);
  }, []);

  return {
    mode,
    selectedAsset,
    editState,
    publishConfig,
    uploadState,
    uploadProgress,
    errorMessage,
    drafts,
    activeDraftId,
    goToHub,
    startCamera,
    pickFromGallery,
    proceedToEdit,
    proceedToDetails,
    backToEdit,
    showDrafts,
    updateEditState,
    updatePublishConfig,
    saveCurrentDraft,
    resumeDraft,
    deleteDraft,
    publishCurrent,
    cancelUpload,
    resetWorkflow,
  };
}
