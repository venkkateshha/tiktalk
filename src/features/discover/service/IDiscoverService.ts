import {
  SearchCategory,
  UnifiedSearchResults,
  VideoSearchResult,
  HashtagSearchResult,
  AudioSearchResult,
  SearchPaginationResult,
} from '../types';

export interface SearchResponse extends UnifiedSearchResults {
  hasMore: boolean;
  nextCursor?: string;
}

export interface IDiscoverService {
  search(
    query: string,
    category: SearchCategory,
    cursor?: string,
    signal?: AbortSignal
  ): Promise<SearchResponse>;

  getDiscoverFeed(
    cursor?: string,
    signal?: AbortSignal
  ): Promise<SearchPaginationResult<VideoSearchResult>>;

  getTrendingHashtags(signal?: AbortSignal): Promise<HashtagSearchResult[]>;

  getTrendingAudio(signal?: AbortSignal): Promise<AudioSearchResult[]>;

  followCreator(creatorId: string, follow: boolean): Promise<void>;
}
