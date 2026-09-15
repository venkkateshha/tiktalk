/**
 * TikTalk Service Boundary: Key-Value Storage Contract
 */

export interface IStorageService {
  getItem<T = string>(key: string): Promise<T | null>;
  setItem<T = string>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}
