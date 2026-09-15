import { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile, ProfileTab, ProfileVideoItem, ProfileStatus } from '../types';
import { IProfileService, profileService, FollowCoordinator } from '../service';

export interface UseProfileReturn {
  profile: UserProfile | null;
  status: ProfileStatus;
  activeTab: ProfileTab;
  videos: ProfileVideoItem[];
  isLoadingVideos: boolean;
  errorMessage: string | null;
  isOwner: boolean;
  setActiveTab: (tab: ProfileTab) => void;
  refresh: () => Promise<void>;
  updateProfileOptimistic: (updater: Partial<UserProfile>) => void;
}

export function useProfile(
  userId?: string,
  service: IProfileService = profileService
): UseProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<ProfileStatus>('loading');
  const [activeTab, setActiveTab] = useState<ProfileTab>('videos');
  const [videos, setVideos] = useState<ProfileVideoItem[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isOwner = !userId || userId === 'me' || profile?.id === 'me';

  // Load Profile Details
  const loadProfile = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus('loading');
    setErrorMessage(null);

    try {
      const data = await service.getProfile(userId, controller.signal);
      setProfile(data);

      if (data.isPrivate && data.followState !== 'following' && !isOwner) {
        setStatus('private_locked');
      } else {
        setStatus('success');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setErrorMessage(err.message || 'Failed to load profile');
      setStatus('error');
    }
  }, [userId, service, isOwner]);

  // Load Profile Videos for Active Tab
  const loadVideos = useCallback(
    async (targetUserId: string, tab: ProfileTab) => {
      setIsLoadingVideos(true);
      try {
        const result = await service.getProfileVideos(targetUserId, tab);
        setVideos(result.items);
      } catch {
        setVideos([]);
      } finally {
        setIsLoadingVideos(false);
      }
    },
    [service]
  );

  useEffect(() => {
    loadProfile();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadProfile]);

  useEffect(() => {
    if (profile && status !== 'private_locked') {
      loadVideos(profile.id, activeTab);
    }
  }, [profile?.id, activeTab, status, loadVideos]);

  // Synchronize follow state changes across screens
  useEffect(() => {
    const unsubscribe = FollowCoordinator.subscribe((event) => {
      if (profile && profile.id === event.userId) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                followState: event.followState,
                followersCount: Math.max(0, prev.followersCount + event.deltaFollowersCount),
              }
            : null
        );
      }
    });
    return unsubscribe;
  }, [profile?.id]);

  const updateProfileOptimistic = useCallback((updater: Partial<UserProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...updater } : null));
  }, []);

  return {
    profile,
    status,
    activeTab,
    videos,
    isLoadingVideos,
    errorMessage,
    isOwner,
    setActiveTab,
    refresh: loadProfile,
    updateProfileOptimistic,
  };
}
