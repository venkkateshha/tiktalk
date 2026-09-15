/**
 * TikTalk Navigation Domain
 * Mobile primary tabs: Home | Discover | Create | Inbox | Profile
 * Stories: Accessible modal / sheet from Home and Profile, NOT a bottom tab.
 */

export type NavigationTab = 'Home' | 'Discover' | 'Create' | 'Inbox' | 'Profile';

export interface StoriesRouteParams {
  userId: string;
  initialStoryId?: string;
  entryPoint: 'home_rail' | 'profile_avatar';
}

export interface NavigationState {
  activeTab: NavigationTab;
  activeStoryModal?: StoriesRouteParams | null;
  history: NavigationTab[];
}
