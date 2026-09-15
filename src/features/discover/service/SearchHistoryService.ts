import { SearchHistoryItem } from '../types';
import { storageService, IStorageService } from '../../../services/storage';

const STORAGE_KEY = '@tiktalk_recent_searches';
const MAX_RECENT_SEARCHES = 10;

export class SearchHistoryService {
  private storage: IStorageService;

  constructor(storage: IStorageService = storageService) {
    this.storage = storage;
  }

  async getRecentSearches(): Promise<SearchHistoryItem[]> {
    try {
      const items = await this.storage.getItem<SearchHistoryItem[]>(STORAGE_KEY);
      if (Array.isArray(items)) {
        return items;
      }
      return [];
    } catch {
      return [];
    }
  }

  async addSearch(rawQuery: string): Promise<SearchHistoryItem[]> {
    const trimmed = rawQuery.trim();
    if (!trimmed) {
      return this.getRecentSearches();
    }

    try {
      const existing = await this.getRecentSearches();
      // Deduplicate case-insensitively
      const filtered = existing.filter(
        (item) => item.query.toLowerCase() !== trimmed.toLowerCase()
      );

      const newItem: SearchHistoryItem = {
        id: `search_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        query: trimmed,
        timestamp: Date.now(),
      };

      const updated = [newItem, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      await this.storage.setItem(STORAGE_KEY, updated);
      return updated;
    } catch {
      return [];
    }
  }

  async removeSearch(id: string): Promise<SearchHistoryItem[]> {
    try {
      const existing = await this.getRecentSearches();
      const updated = existing.filter((item) => item.id !== id);
      await this.storage.setItem(STORAGE_KEY, updated);
      return updated;
    } catch {
      return [];
    }
  }

  async clearSearches(): Promise<void> {
    try {
      await this.storage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore failure in clearing
    }
  }
}

export const searchHistoryService = new SearchHistoryService();
