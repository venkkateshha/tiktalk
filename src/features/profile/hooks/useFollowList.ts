import { useState, useEffect, useCallback, useMemo } from 'react';
import { FollowUserSummary } from '../types';
import { IProfileService, profileService } from '../service';

export interface UseFollowListReturn {
  users: FollowUserSummary[];
  filteredUsers: FollowUserSummary[];
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  setSearchQuery: (query: string) => void;
  toggleFollowUser: (user: FollowUserSummary) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useFollowList(
  userId: string,
  type: 'followers' | 'following',
  service: IProfileService = profileService
): UseFollowListReturn {
  const [users, setUsers] = useState<FollowUserSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data =
        type === 'followers'
          ? await service.getFollowers(userId)
          : await service.getFollowing(userId);
      setUsers(data);
    } catch (err: any) {
      setError(err.message || `Failed to fetch ${type}`);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, type, service]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const toggleFollowUser = useCallback(
    async (user: FollowUserSummary) => {
      const originalState = user.followState;
      const nextState = originalState === 'following' ? 'none' : 'following';

      // Optimistic update
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, followState: nextState } : u))
      );

      try {
        if (originalState === 'following') {
          await service.unfollowUser(user.id);
        } else {
          await service.followUser(user.id);
        }
      } catch {
        // Rollback
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, followState: originalState } : u))
        );
      }
    },
    [service]
  );

  return {
    users,
    filteredUsers,
    searchQuery,
    isLoading,
    error,
    setSearchQuery,
    toggleFollowUser,
    refresh: loadList,
  };
}
