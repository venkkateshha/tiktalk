/**
 * TikTalk Service Boundary: API Client Contract
 */

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  timeoutMs?: number;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export interface IApiClient {
  get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>>;
  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>>;
  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>>;
  delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>>;
  setHeader(key: string, value: string): void;
  removeHeader(key: string): void;
}
