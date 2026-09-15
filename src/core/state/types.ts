/**
 * TikTalk Core State Architecture
 * Scalable state patterns for Loading, Success, Empty, Error, Offline, and Retry.
 */

export type UIStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error' | 'offline';

export interface AsyncState<T> {
  status: UIStatus;
  data: T | null;
  error: Error | string | null;
  isLoading: boolean;
  isEmpty: boolean;
  isError: boolean;
  isSuccess: boolean;
  isOffline: boolean;
}

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };
