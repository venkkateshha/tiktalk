/**
 * TikTalk Phase 8: NotificationPreferencesModal Component
 * In-app settings dialog for managing push and in-app activity notifications.
 * Invariant: Security alerts cannot be disabled.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { A11yStandards } from '../../../core/a11y/a11yStandards';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import { NotificationPreferences } from '../../../domain/notification';

export interface NotificationPreferencesModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme, typography } = useTheme();
  const { preferences, togglePreference } = useNotificationPreferences();

  const settingsList: {
    key: keyof NotificationPreferences;
    title: string;
    description: string;
    isLocked?: boolean;
  }[] = [
    {
      key: 'likes',
      title: 'Likes',
      description: 'Alerts when users like your videos or comments',
    },
    {
      key: 'comments',
      title: 'Comments & Replies',
      description: 'Alerts when users comment or reply to your posts',
    },
    {
      key: 'mentions',
      title: 'Mentions & Tags',
      description: 'Alerts when someone mentions you in a post or story',
    },
    {
      key: 'followers',
      title: 'New Followers',
      description: 'Alerts when someone begins following your profile',
    },
    {
      key: 'stories',
      title: 'Story Activity',
      description: 'Alerts for reactions, replies, and views on your stories',
    },
    {
      key: 'live',
      title: 'LIVE Notifications',
      description: 'Alerts when creators you follow go LIVE',
    },
    {
      key: 'messages',
      title: 'Direct Messages',
      description: 'Alerts for direct messages and chat requests',
    },
    {
      key: 'earnings',
      title: 'Earnings & Monetization',
      description: 'Weekly Monday UPI payout and diamond transaction notices',
    },
    {
      key: 'system',
      title: 'System Announcements',
      description: 'Platform updates, policies, and community guidelines',
    },
    {
      key: 'security',
      title: 'Security Alerts',
      description: 'New login attempts, password changes, and account safety',
      isLocked: true,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.modalCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          accessible={true}
          accessibilityRole="none"
          accessibilityViewIsModal={true}
          accessibilityLabel="Notification preferences"
        >
          {/* Header */}
          <View style={[styles.headerBar, { borderBottomColor: theme.border }]}>
            <Text
              style={[
                styles.headerTitle,
                { color: theme.text, fontSize: typography.fontSize.md },
              ]}
            >
              Notification Settings
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, A11yStandards.minTouchTarget]}
              onPress={onClose}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close notification settings"
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Settings List */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {settingsList.map((item) => {
              const isEnabled = preferences[item.key];
              return (
                <View
                  key={item.key}
                  style={[styles.settingRow, { borderBottomColor: theme.border }]}
                >
                  <View style={styles.settingTextCol}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[
                          styles.settingTitle,
                          { color: theme.text, fontSize: typography.fontSize.sm },
                        ]}
                      >
                        {item.title}
                      </Text>
                      {item.isLocked && (
                        <View
                          style={[
                            styles.lockedBadge,
                            { backgroundColor: BrandColors.cyan },
                          ]}
                        >
                          <Text style={styles.lockedBadgeText}>PROTECTED</Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.settingDesc,
                        { color: theme.textSecondary, fontSize: typography.fontSize.xs },
                      ]}
                    >
                      {item.description}
                    </Text>
                  </View>

                  <Switch
                    value={item.isLocked ? true : isEnabled}
                    disabled={item.isLocked}
                    onValueChange={() => togglePreference(item.key)}
                    trackColor={{
                      false: theme.border,
                      true: BrandColors.cyan,
                    }}
                    thumbColor={BrandColors.white}
                    accessible={true}
                    accessibilityRole="switch"
                    accessibilityLabel={`${item.title} notifications`}
                    accessibilityState={{ checked: isEnabled, disabled: item.isLocked }}
                  />
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontWeight: '700',
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingTextCol: {
    flex: 1,
    marginRight: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  settingTitle: {
    fontWeight: '600',
  },
  lockedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lockedBadgeText: {
    color: BrandColors.black,
    fontSize: 9,
    fontWeight: '800',
  },
  settingDesc: {
    lineHeight: 16,
  },
});
