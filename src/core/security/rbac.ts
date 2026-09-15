/**
 * TikTalk Role-Based Access Control (RBAC) Architecture
 * Fine-grained permissions matrix for Viewer, Creator, Moderator, and Admin roles
 */

import { UserRole } from './types';

export type Permission =
  | 'feed:view'
  | 'content:create'
  | 'content:edit_own'
  | 'content:delete_own'
  | 'content:moderate'
  | 'comments:post'
  | 'comments:moderate'
  | 'analytics:view_own'
  | 'analytics:view_global'
  | 'monetization:access'
  | 'admin:users_manage'
  | 'admin:system_config';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  viewer: [
    'feed:view',
    'comments:post',
  ],
  creator: [
    'feed:view',
    'content:create',
    'content:edit_own',
    'content:delete_own',
    'comments:post',
    'analytics:view_own',
  ],
  verified_creator: [
    'feed:view',
    'content:create',
    'content:edit_own',
    'content:delete_own',
    'comments:post',
    'analytics:view_own',
    'monetization:access',
  ],
  business: [
    'feed:view',
    'content:create',
    'content:edit_own',
    'content:delete_own',
    'comments:post',
    'analytics:view_own',
    'monetization:access',
  ],
  moderator: [
    'feed:view',
    'comments:post',
    'content:moderate',
    'comments:moderate',
  ],
  admin: [
    'feed:view',
    'content:create',
    'content:edit_own',
    'content:delete_own',
    'content:moderate',
    'comments:post',
    'comments:moderate',
    'analytics:view_own',
    'analytics:view_global',
    'monetization:access',
    'admin:users_manage',
  ],
  super_admin: [
    'feed:view',
    'content:create',
    'content:edit_own',
    'content:delete_own',
    'content:moderate',
    'comments:post',
    'comments:moderate',
    'analytics:view_own',
    'analytics:view_global',
    'monetization:access',
    'admin:users_manage',
    'admin:system_config',
  ],
};

/**
 * Checks whether an array of assigned roles grants a specific permission.
 */
export function hasPermission(roles: UserRole[], permission: Permission): boolean {
  for (const role of roles) {
    const permissions = ROLE_PERMISSIONS[role];
    if (permissions && permissions.includes(permission)) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if user has admin privileges.
 */
export function isAdminUser(roles: UserRole[]): boolean {
  return roles.includes('admin') || roles.includes('super_admin');
}
