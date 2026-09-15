/**
 * TikTalk Phase 8: NotificationRow Component
 * Production-ready activity item displaying real sender data, type badges,
 * formatted timestamps, unread indicators, follow-back actions, and deletion.
 * Zero fake data.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppNotification, NotificationType } from '../../../domain/notification';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { Avatar } from '../../../components/ui/Avatar';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface NotificationRowProps {
  notification: AppNotification;
  onPress: (notification: AppNotification) => void;
  onDelete: (notificationId: string) => void;
  onFollowBack?: (userId: string) => void;
}

export const NotificationRow: React.FC<NotificationRowProps> = ({
  notification,
  onPress,
  onDelete,
  onFollowBack,
}) => {
  const { theme, typography } = useTheme();

  const getBadgeIcon = (type: NotificationType): { name: keyof typeof Ionicons.glyphMap; color: string } => {
    switch (type) {
      case 'like':
        return { name: 'heart', color: BrandColors.pink };
      case 'comment':
      case 'reply':
        return { name: 'chatbubble', color: BrandColors.cyan };
      case 'mention':
        return { name: 'at', color: BrandColors.cyan };
      case 'follow':
        return { name: 'person-add', color: BrandColors.cyan };
      case 'repost':
        return { name: 'repeat', color: BrandColors.cyan };
      case 'story_reply':
      case 'story_view':
      case 'story_reaction':
        return { name: 'flame', color: BrandColors.pink };
      case 'live':
        return { name: 'radio', color: BrandColors.pink };
      case 'message':
        return { name: 'mail', color: BrandColors.cyan };
      case 'monetization':
        return { name: 'cash', color: BrandColors.cyan };
      case 'security':
        return { name: 'shield-checkmark', color: BrandColors.cyan };
      case 'announcement':
      case 'system':
      default:
        return { name: 'megaphone', color: BrandColors.cyan };
    }
  };

  const formatTime = (iso: string): string => {
    try {
      const date = new Date(iso);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
      if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d`;
      return `${Math.floor(diffSec / 604800)}w`;
    } catch {
      return '';
    }
  };

  const badge = getBadgeIcon(notification.type);
  const senderName = notification.sender?.displayName || notification.sender?.username;
  const isFollowNotification = notification.type === 'follow';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !notification.isRead && { backgroundColor: theme.card },
      ]}
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${notification.title}, ${notification.body}, ${formatTime(notification.createdAt)}, ${notification.isRead ? 'read' : 'unread'}`}
    >
      {/* 1. Sender Avatar or System Icon with Category Badge */}
      <View style={styles.avatarWrapper}>
        {notification.sender ? (
          <Avatar
            source={notification.sender.avatarUrl}
            name={senderName || 'User'}
            size="md"
            isVerified={notification.sender.verificationStatus === 'verified'}
          />
        ) : (
          <View style={[styles.systemIconCircle, { backgroundColor: theme.surface }]}>
            <Ionicons name={badge.name} size={22} color={badge.color} />
          </View>
        )}

        {/* Small category badge pill attached to avatar */}
        {notification.sender && (
          <View style={[styles.typeBadgePill, { backgroundColor: badge.color }]}>
            <Ionicons name={badge.name} size={10} color={BrandColors.black} />
          </View>
        )}
      </View>

      {/* 2. Text Content */}
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.bodyText,
              { color: theme.text, fontSize: typography.fontSize.sm },
            ]}
            numberOfLines={3}
          >
            {senderName ? (
              <Text style={{ fontWeight: '700' }}>{senderName} </Text>
            ) : null}
            {notification.body || notification.title}
          </Text>
        </View>

        <Text
          style={[
            styles.timestampText,
            { color: theme.textSecondary, fontSize: typography.fontSize.xs },
          ]}
        >
          {formatTime(notification.createdAt)}
        </Text>
      </View>

      {/* 3. Trailing Action: Follow Back, Thumbnail, or Delete */}
      <View style={styles.trailingContainer}>
        {isFollowNotification && notification.senderId && onFollowBack && (
          <TouchableOpacity
            style={[
              styles.followBackButton,
              A11yStandards.minTouchTarget,
              { backgroundColor: BrandColors.pink },
            ]}
            onPress={(e) => {
              e.stopPropagation();
              onFollowBack(notification.senderId!);
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Follow back ${senderName || 'user'}`}
          >
            <Text style={[styles.followBackText, { color: BrandColors.white }]}>
              Follow
            </Text>
          </TouchableOpacity>
        )}

        {notification.thumbnailUrl ? (
          <Image
            source={{ uri: notification.thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : null}

        {/* Unread indicator dot */}
        {!notification.isRead && (
          <View
            style={[styles.unreadDot, { backgroundColor: BrandColors.pink }]}
          />
        )}

        {/* Delete button */}
        <TouchableOpacity
          style={[styles.deleteButton, A11yStandards.minTouchTarget]}
          onPress={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Delete notification"
        >
          <Ionicons name="trash-outline" size={16} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 64,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  systemIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadgePill: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: BrandColors.black,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    marginBottom: 4,
  },
  bodyText: {
    lineHeight: 18,
  },
  timestampText: {
    marginTop: 2,
  },
  trailingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  followBackButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBackText: {
    fontSize: 12,
    fontWeight: '700',
  },
  thumbnail: {
    width: 40,
    height: 52,
    borderRadius: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deleteButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
