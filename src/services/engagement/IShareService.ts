/**
 * TikTalk Phase 7: Share Service Contract
 * Cross-platform share via Web Share API, Clipboard fallback, or Native Share
 */

export interface ShareResult {
  success: boolean;
  method: 'web_share' | 'clipboard' | 'native_share' | 'cancelled' | 'failed';
  message?: string;
}

export interface IShareService {
  /**
   * Generates the canonical canonical public URL for a post.
   */
  getPostShareUrl(postId: string): string;

  /**
   * Invokes native sharing or clipboard fallback.
   */
  sharePost(payload: {
    postId: string;
    caption?: string;
    authorUsername?: string;
  }): Promise<ShareResult>;

  /**
   * Direct copy of canonical link to clipboard.
   */
  copyPostLink(postId: string): Promise<boolean>;
}
