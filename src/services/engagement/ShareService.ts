/**
 * TikTalk Phase 7: Share Service Implementation
 * Cross-platform sharing with Web Share API, Native Share, and Clipboard fallback.
 */

import { Platform, Share } from 'react-native';
import { IShareService, ShareResult } from './IShareService';

const BASE_SHARE_URL = 'https://tiktalk.video/post';

export class ShareService implements IShareService {
  getPostShareUrl(postId: string): string {
    return `${BASE_SHARE_URL}/${encodeURIComponent(postId)}`;
  }

  async copyPostLink(postId: string): Promise<boolean> {
    const url = this.getPostShareUrl(postId);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        return true;
      }
      // Fallback for older browsers
      if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
      }
    } catch {
      // Failed copy
    }
    return false;
  }

  async sharePost(payload: {
    postId: string;
    caption?: string;
    authorUsername?: string;
  }): Promise<ShareResult> {
    const url = this.getPostShareUrl(payload.postId);
    const title = payload.authorUsername
      ? `Watch @${payload.authorUsername}'s video on TikTalk`
      : 'Watch on TikTalk';
    const message = payload.caption ? `${payload.caption}\n${url}` : url;

    // 1. Web Platform
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
          await navigator.share({
            title,
            text: payload.caption || title,
            url,
          });
          return { success: true, method: 'web_share' };
        } catch (err: any) {
          if (err?.name === 'AbortError') {
            return { success: true, method: 'cancelled', message: 'Share dismissed' };
          }
          // Fallback to clipboard on error
        }
      }

      // Clipboard fallback
      const copied = await this.copyPostLink(payload.postId);
      if (copied) {
        return {
          success: true,
          method: 'clipboard',
          message: 'Link copied to clipboard!',
        };
      }

      return {
        success: false,
        method: 'failed',
        message: 'Could not share or copy link',
      };
    }

    // 2. Mobile Platforms (iOS / Android)
    try {
      const result = await Share.share({
        message,
        url,
        title,
      });

      if (result.action === Share.sharedAction) {
        return { success: true, method: 'native_share' };
      } else if (result.action === Share.dismissedAction) {
        return { success: true, method: 'cancelled', message: 'Share dismissed' };
      }
      return { success: true, method: 'native_share' };
    } catch (err: any) {
      // Fallback to clipboard
      const copied = await this.copyPostLink(payload.postId);
      if (copied) {
        return {
          success: true,
          method: 'clipboard',
          message: 'Link copied to clipboard!',
        };
      }
      return {
        success: false,
        method: 'failed',
        message: err?.message || 'Failed to share',
      };
    }
  }
}

export const shareService = new ShareService();
