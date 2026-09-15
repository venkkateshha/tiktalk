import { useState, useEffect, useRef, useCallback } from 'react';
import { FeedFilter, FeedItemModel, FeedStatus, FeedState } from '../types';
import { IFeedService, feedService } from '../service';
import { NetworkError } from '../../../core/errors/AppError';
import {
  EngagementCoordinator,
  engagementService,
} from '../../../services/engagement';

export interface UseFeedReturn extends FeedState {
  setFilter: (filter: FeedFilter) => void;
  setActiveIndex: (index: number) => void;
  togglePlayPause: () => void;
  toggleMute: () => void;
  toggleLike: (item: FeedItemModel) => Promise<void>;
  toggleSave: (item: FeedItemModel) => Promise<void>;
  toggleFollow: (item: FeedItemModel) => Promise<void>;
  toggleRepost: (item: FeedItemModel) => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useFeed(
  initialFilter: FeedFilter = 'forYou',
  service: IFeedService = feedService
): UseFeedReturn {
  const [filter, setFilterState] = useState<FeedFilter>(initialFilter);
  const [items, setItems] = useState<FeedItemModel[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [status, setStatus] = useState<FeedStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchFeed = useCallback(
    async (targetFilter: FeedFilter, cursor?: string, isAppend = false) => {
      // Cancel previous stale request if in-flight
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (!isAppend) {
        setStatus('loading');
        setErrorMessage(null);
      }

      try {
        const result = await service.getFeed(targetFilter, cursor, controller.signal);
        const mappedItems = result.items.map((it) => {
          const cached = EngagementCoordinator.getCachedState(it.id);
          if (!cached) return it;
          return {
            ...it,
            isLiked: cached.hasLiked,
            isSaved: cached.hasBookmarked,
            isReposted: cached.hasReposted,
            engagement: {
              ...it.engagement,
              likeCount: cached.likeCount ?? it.engagement.likeCount,
              bookmarkCount: cached.bookmarkCount ?? it.engagement.bookmarkCount,
              repostCount: cached.repostCount ?? it.engagement.repostCount,
              commentCount: cached.commentCount ?? it.engagement.commentCount,
            },
          };
        });

        setItems((prev) => (isAppend ? [...prev, ...mappedItems] : mappedItems));
        setHasMore(result.hasMore);
        setNextCursor(result.nextCursor);

        if (result.items.length === 0 && !isAppend) {
          setStatus('empty');
        } else {
          setStatus('success');
        }
      } catch (err: any) {
        if (controller.signal.aborted) return;

        const isOffline =
          (err instanceof Error && err.message.toLowerCase().includes('offline')) ||
          (typeof navigator !== 'undefined' && !navigator.onLine);

        if (isOffline) {
          setStatus('offline');
          setErrorMessage('No Internet Connection. Connect to network to load videos.');
        } else if (err instanceof NetworkError && err.status === 503) {
          setStatus('unavailable');
          setErrorMessage('Feed Engine is temporarily undergoing maintenance.');
        } else {
          // When backend feed is not yet seeded or returning 404/network error, show polished empty/unavailable state
          setStatus('empty');
          setErrorMessage(null);
        }
      }
    },
    [service]
  );

  // Re-fetch when filter changes
  useEffect(() => {
    setActiveIndex(0);
    fetchFeed(filter);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [filter, fetchFeed]);

  // Subscribe to EngagementCoordinator for cross-screen updates
  useEffect(() => {
    const unsubscribe = EngagementCoordinator.subscribe((event) => {
      if (event.state) {
        setItems((prev) =>
          prev.map((i) => {
            if (i.id !== event.postId) return i;
            return {
              ...i,
              isLiked: event.state!.hasLiked ?? i.isLiked,
              isSaved: event.state!.hasBookmarked ?? i.isSaved,
              isReposted: event.state!.hasReposted ?? i.isReposted,
              engagement: {
                ...i.engagement,
                likeCount: event.state!.likeCount ?? i.engagement.likeCount,
                bookmarkCount: event.state!.bookmarkCount ?? i.engagement.bookmarkCount,
                repostCount: event.state!.repostCount ?? i.engagement.repostCount,
                commentCount: event.state!.commentCount ?? i.engagement.commentCount,
              },
            };
          })
        );
      }
    });

    return unsubscribe;
  }, []);

  const setFilter = useCallback((newFilter: FeedFilter) => {
    setFilterState(newFilter);
  }, []);

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // Optimistic Like with Rollback
  const toggleLike = useCallback(
    async (item: FeedItemModel) => {
      const originalLiked = item.isLiked;
      const originalCount = item.engagement.likeCount;
      const nextLiked = !originalLiked;
      const nextCount =
        typeof originalCount === 'number'
          ? nextLiked
            ? originalCount + 1
            : Math.max(0, originalCount - 1)
          : undefined;

      // Apply optimistic update
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, isLiked: nextLiked, engagement: { ...i.engagement, likeCount: nextCount } }
            : i
        )
      );

      try {
        await Promise.all([
          service.likePost(item.id, nextLiked),
          engagementService.toggleLike(item.id, originalLiked, originalCount),
        ]);
      } catch {
        // Rollback on failure
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, isLiked: originalLiked, engagement: { ...i.engagement, likeCount: originalCount } }
              : i
          )
        );
      }
    },
    [service]
  );

  // Optimistic Save with Rollback
  const toggleSave = useCallback(
    async (item: FeedItemModel) => {
      const originalSaved = item.isSaved;
      const originalCount = item.engagement.bookmarkCount;
      const nextSaved = !originalSaved;
      const nextCount =
        typeof originalCount === 'number'
          ? nextSaved
            ? originalCount + 1
            : Math.max(0, originalCount - 1)
          : undefined;

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, isSaved: nextSaved, engagement: { ...i.engagement, bookmarkCount: nextCount } }
            : i
        )
      );

      try {
        await Promise.all([
          service.savePost(item.id, nextSaved),
          engagementService.toggleSave(item.id, originalSaved, originalCount),
        ]);
      } catch {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, isSaved: originalSaved, engagement: { ...i.engagement, bookmarkCount: originalCount } }
              : i
          )
        );
      }
    },
    [service]
  );

  // Optimistic Follow with Rollback
  const toggleFollow = useCallback(
    async (item: FeedItemModel) => {
      const originalFollowing = item.isFollowingCreator;
      const nextFollowing = !originalFollowing;

      setItems((prev) =>
        prev.map((i) =>
          i.creatorId === item.creatorId
            ? { ...i, isFollowingCreator: nextFollowing }
            : i
        )
      );

      try {
        await service.followCreator(item.creatorId, nextFollowing);
      } catch {
        setItems((prev) =>
          prev.map((i) =>
            i.creatorId === item.creatorId
              ? { ...i, isFollowingCreator: originalFollowing }
              : i
          )
        );
      }
    },
    [service]
  );

  // Optimistic Repost with Rollback
  const toggleRepost = useCallback(
    async (item: FeedItemModel) => {
      const originalReposted = item.isReposted;
      const nextReposted = !originalReposted;

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, isReposted: nextReposted }
            : i
        )
      );

      try {
        await Promise.all([
          service.repostPost(item.id, nextReposted),
          engagementService.toggleRepost(item.id, originalReposted, item.engagement.repostCount),
        ]);
      } catch {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, isReposted: originalReposted }
              : i
          )
        );
      }
    },
    [service]
  );

  const refresh = useCallback(async () => {
    await fetchFeed(filter);
  }, [fetchFeed, filter]);

  const loadMore = useCallback(async () => {
    if (hasMore && nextCursor && status !== 'loading') {
      await fetchFeed(filter, nextCursor, true);
    }
  }, [fetchFeed, filter, hasMore, nextCursor, status]);

  return {
    filter,
    items,
    activeIndex,
    status,
    errorMessage,
    isPlaying,
    isMuted,
    hasMore,
    nextCursor,
    setFilter,
    setActiveIndex,
    togglePlayPause,
    toggleMute,
    toggleLike,
    toggleSave,
    toggleFollow,
    toggleRepost,
    refresh,
    loadMore,
  };
}
