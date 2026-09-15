/**
 * TikTalk Service Boundary: Baseline Storage Service Implementation
 * Cross-platform memory + Web localStorage fallback
 */

import { Platform } from 'react-native';
import { IStorageService } from './IStorageService';

export class StorageService implements IStorageService {
  private memoryStore: Map<string, string> = new Map();

  async getItem<T = string>(key: string): Promise<T | null> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(key);
        if (item === null) return null;
        try {
          return JSON.parse(item) as T;
        } catch {
          return item as unknown as T;
        }
      }
    } catch {
      // Fallback to memory
    }

    const val = this.memoryStore.get(key);
    if (!val) return null;
    try {
      return JSON.parse(val) as T;
    } catch {
      return val as unknown as T;
    }
  }

  async setItem<T = string>(key: string, value: T): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, serialized);
      }
    } catch {
      // Fallback to memory
    }
    this.memoryStore.set(key, serialized);
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Fallback to memory
    }
    this.memoryStore.delete(key);
  }

  async clear(): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch {
      // Fallback to memory
    }
    this.memoryStore.clear();
  }
}

export const storageService: IStorageService = new StorageService();
