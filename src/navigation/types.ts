/**
 * TikTalk Navigation Types
 * Mobile: Home | Discover | Create | Inbox | Profile
 * Web: Responsive sidebar / contextual rail
 * Stories: Modal / sheet accessible from Home & Profile (NOT a bottom tab)
 */

export type NavigationTab = 'Home' | 'Discover' | 'Create' | 'Inbox' | 'Profile';

export interface StoriesRouteParams {
  userId: string;
  initialStoryId?: string;
  entryPoint: 'home_rail' | 'profile_avatar';
}

export interface NavigationContextValue {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  activeStory: StoriesRouteParams | null;
  openStories: (params: StoriesRouteParams) => void;
  closeStories: () => void;
  isCreatingStory: boolean;
  openStoryCreation: () => void;
  closeStoryCreation: () => void;
  canGoBack: boolean;
  goBack: () => void;
}

