/**
 * TikTalk Phase 3: Discover & Search Domain Models
 * Clean typed contracts for discovery feeds, search categories, and search history
 * Zero mock/fake business data — backend-ready
 */

export type SearchCategory = 'all' | 'people' | 'videos' | 'hashtags' | 'audio';

export type SearchStatus =
  | 'initial'
  | 'typing'
  | 'loading'
  | 'success'
  | 'empty'
  | 'offline'
  | 'unavailable'
  | 'error';

export interface CreatorSearchResult {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  verificationStatus: 'none' | 'verified' | 'creator';
  isFollowing: boolean;
  followerCount?: number;
  bio?: string;
}

export interface VideoSearchResult {
  id: string;
  thumbnailUrl?: string;
  videoUrl: string;
  caption: string;
  creator: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  durationSeconds: number;
  viewCount?: number;
  likeCount?: number;
}

export interface HashtagSearchResult {
  id: string;
  tag: string;
  contentCount?: number;
}

export interface AudioSearchResult {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  artworkUrl?: string;
  durationSeconds: number;
  usageCount?: number;
}

export interface UnifiedSearchResults {
  creators: CreatorSearchResult[];
  videos: VideoSearchResult[];
  hashtags: HashtagSearchResult[];
  audio: AudioSearchResult[];
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
}

export interface SearchPaginationResult<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface DiscoverState {
  query: string;
  activeCategory: SearchCategory;
  status: SearchStatus;
  errorMessage: string | null;
  results: UnifiedSearchResults;
  history: SearchHistoryItem[];
  hasMore: boolean;
  nextCursor?: string;
}
