/**
 * TikTalk Service Boundary: Baseline API Client Implementation
 * Production-ready HTTP client abstraction with interceptors and timeout handling
 */

import { Config } from '../../core/config/environment';
import { NetworkError } from '../../core/errors/AppError';
import { IApiClient, RequestOptions, ApiResponse } from './IApiClient';

export class ApiClient implements IApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = Config.apiBaseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-App-Version': Config.appVersion,
    };
  }

  setHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value;
  }

  removeHeader(key: string): void {
    delete this.defaultHeaders[key];
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(`${this.baseUrl}${cleanEndpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        url.searchParams.append(key, String(val));
      });
    }
    return url.toString();
  }

  private async request<T>(
    endpoint: string,
    method: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, options.params);
    const headers = { ...this.defaultHeaders, ...options.headers };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 15000);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((val, key) => {
        responseHeaders[key] = val;
      });

      if (!response.ok) {
        throw new NetworkError(
          `Request failed with status ${response.status}`,
          response.status,
          { endpoint, method }
        );
      }

      const data = (await response.json()) as T;
      return { data, status: response.status, headers: responseHeaders };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof NetworkError) {
        throw err;
      }
      throw new NetworkError(
        err instanceof Error ? err.message : 'Network request failed',
        undefined,
        { endpoint, method }
      );
    }
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'GET', undefined, options);
  }

  async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'POST', body, options);
  }

  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'PUT', body, options);
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'DELETE', undefined, options);
  }
}

export const apiClient: IApiClient = new ApiClient();
