import { useState, useEffect, useRef, useCallback } from 'react';
import {
  SearchCategory,
  SearchStatus,
  UnifiedSearchResults,
  SearchHistoryItem,
  CreatorSearchResult,
} from '../types';
import {
  IDiscoverService,
  discoverService,
  SearchHistoryService,
  searchHistoryService,
} from '../service';
import { NetworkError } from '../../../core/errors/AppError';

export interface UseSearchReturn {
  query: string;
  activeCategory: SearchCategory;
  status: SearchStatus;
  errorMessage: string | null;
  results: UnifiedSearchResults;
  history: SearchHistoryItem[];
  hasMore: boolean;
  nextCursor?: string;
  setQuery: (query: string) => void;
  setActiveCategory: (category: SearchCategory) => void;
  submitSearch: (overrideQuery?: string) => Promise<void>;
  clearSearch: () => void;
  removeHistoryItem: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  toggleFollowCreator: (creator: CreatorSearchResult) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

const EMPTY_RESULTS: UnifiedSearchResults = {
  creators: [],
  videos: [],
  hashtags: [],
  audio: [],
};

export function useSearch(
  initialCategory: SearchCategory = 'all',
  service: IDiscoverService = discoverService,
  historyService: SearchHistoryService = searchHistoryService
): UseSearchReturn {
  const [query, setQueryState] = useState<string>('');
  const [activeCategory, setActiveCategoryState] = useState<SearchCategory>(initialCategory);
  const [status, setStatus] = useState<SearchStatus>('initial');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [results, setResults] = useState<UnifiedSearchResults>(EMPTY_RESULTS);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<any>(null);

  // Load search history on mount
  useEffect(() => {
    let isMounted = true;
    historyService.getRecentSearches().then((items) => {
      if (isMounted) setHistory(items);
    });
    return () => {
      isMounted = false;
    };
  }, [historyService]);

  const executeSearch = useCallback(
    async (
      targetQuery: string,
      targetCategory: SearchCategory,
      cursor?: string,
      isAppend = false
    ) => {
      const trimmed = targetQuery.trim();
      if (!trimmed) {
        setResults(EMPTY_RESULTS);
        setStatus('initial');
        setErrorMessage(null);
        return;
      }

      // Cancel previous in-flight request
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
        const response = await service.search(
          trimmed,
          targetCategory,
          cursor,
          controller.signal
        );

        if (controller.signal.aborted) return;

        if (isAppend) {
          setResults((prev) => ({
            creators: [...prev.creators, ...response.creators],
            videos: [...prev.videos, ...response.videos],
            hashtags: [...prev.hashtags, ...response.hashtags],
            audio: [...prev.audio, ...response.audio],
          }));
        } else {
          setResults({
            creators: response.creators || [],
            videos: response.videos || [],
            hashtags: response.hashtags || [],
            audio: response.audio || [],
          });
        }

        setHasMore(response.hasMore);
        setNextCursor(response.nextCursor);

        const totalItems =
          (response.creators?.length || 0) +
          (response.videos?.length || 0) +
          (response.hashtags?.length || 0) +
          (response.audio?.length || 0);

        if (totalItems === 0 && !isAppend) {
          setStatus('empty');
        } else {
          setStatus('success');
        }

        // Persist to history on submission
        const updatedHistory = await historyService.addSearch(trimmed);
        setHistory(updatedHistory);
      } catch (err: any) {
        if (controller.signal.aborted) return;

        // Persist submitted search to history even if backend is unseeded/empty
        historyService.addSearch(trimmed).then((updated) => {
          setHistory(updated);
        }).catch(() => {});

        const isOffline =
          (err instanceof Error && err.message.toLowerCase().includes('offline')) ||
          (typeof navigator !== 'undefined' && !navigator.onLine);

        if (isOffline) {
          setStatus('offline');
          setErrorMessage('No Internet Connection. Connect to search TikTalk.');
        } else if (err instanceof NetworkError && err.status === 503) {
          setStatus('unavailable');
          setErrorMessage('Search cluster is undergoing scheduled maintenance.');
        } else {
          // When backend search index is empty or returns 404, show empty state instead of raw error
          setStatus('empty');
          setErrorMessage(null);
        }
      }
    },
    [service, historyService]
  );

  // Debounce search on query typing (300ms)
  const setQuery = useCallback(
    (newQuery: string) => {
      setQueryState(newQuery);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      const trimmed = newQuery.trim();
      if (!trimmed) {
        setStatus('initial');
        setResults(EMPTY_RESULTS);
        return;
      }

      setStatus('typing');

      debounceTimerRef.current = setTimeout(() => {
        if (trimmed.length >= 2) {
          executeSearch(trimmed, activeCategory);
        }
      }, 300);
    },
    [activeCategory, executeSearch]
  );

  // Category switching
  const setActiveCategory = useCallback(
    (newCategory: SearchCategory) => {
      setActiveCategoryState(newCategory);
      if (query.trim()) {
        executeSearch(query, newCategory);
      }
    },
    [query, executeSearch]
  );

  // Explicit submit (e.g. on Enter or Search button click)
  const submitSearch = useCallback(
    async (overrideQuery?: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      const target = overrideQuery !== undefined ? overrideQuery : query;
      if (overrideQuery !== undefined) {
        setQueryState(overrideQuery);
      }
      await executeSearch(target, activeCategory);
    },
    [query, activeCategory, executeSearch]
  );

  const clearSearch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setQueryState('');
    setStatus('initial');
    setResults(EMPTY_RESULTS);
    setErrorMessage(null);
  }, []);

  const removeHistoryItem = useCallback(
    async (id: string) => {
      const updated = await historyService.removeSearch(id);
      setHistory(updated);
    },
    [historyService]
  );

  const clearHistory = useCallback(async () => {
    await historyService.clearSearches();
    setHistory([]);
  }, [historyService]);

  // Optimistic Follow Toggle
  const toggleFollowCreator = useCallback(
    async (creator: CreatorSearchResult) => {
      const originalFollowing = creator.isFollowing;
      const nextFollowing = !originalFollowing;

      setResults((prev) => ({
        ...prev,
        creators: prev.creators.map((c) =>
          c.id === creator.id ? { ...c, isFollowing: nextFollowing } : c
        ),
      }));

      try {
        await service.followCreator(creator.id, nextFollowing);
      } catch {
        // Rollback
        setResults((prev) => ({
          ...prev,
          creators: prev.creators.map((c) =>
            c.id === creator.id ? { ...c, isFollowing: originalFollowing } : c
          ),
        }));
      }
    },
    [service]
  );

  const loadMore = useCallback(async () => {
    if (hasMore && nextCursor && status !== 'loading') {
      await executeSearch(query, activeCategory, nextCursor, true);
    }
  }, [hasMore, nextCursor, status, query, activeCategory, executeSearch]);

  const refresh = useCallback(async () => {
    if (query.trim()) {
      await executeSearch(query, activeCategory);
    }
  }, [query, activeCategory, executeSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    query,
    activeCategory,
    status,
    errorMessage,
    results,
    history,
    hasMore,
    nextCursor,
    setQuery,
    setActiveCategory,
    submitSearch,
    clearSearch,
    removeHistoryItem,
    clearHistory,
    toggleFollowCreator,
    loadMore,
    refresh,
  };
}
