import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { Avatar } from '../../../components/ui/Avatar';
import { Story, StoryUserGroup } from '../types';

export interface StoryHeaderProps {
  group: StoryUserGroup;
  story: Story;
  isOwner: boolean;
  onClose: () => void;
  onMuteUser?: () => void;
  onReportStory?: () => void;
  onDeleteStory?: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

export const StoryHeader: React.FC<StoryHeaderProps> = ({
  group,
  story,
  isOwner,
  onClose,
  onMuteUser,
  onReportStory,
  onDeleteStory,
  onPause,
  onResume,
}) => {
  const { typography, brandColors } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Format relative timestamp
  const getRelativeTime = (isoString: string): string => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  const handleOpenMenu = () => {
    onPause?.();
    setIsMenuOpen(true);
  };

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
    onResume?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.userInfoSlot}>
        <Avatar
          source={group.avatarUrl}
          name={group.username}
          size="sm"
          isVerified={group.isVerified}
        />
        <View style={styles.userTextSlot}>
          <View style={styles.nameRow}>
            <Text
              style={[
                styles.username,
                { color: brandColors.white, fontSize: typography.fontSize.sm },
              ]}
              numberOfLines={1}
            >
              {group.username}
            </Text>
            {story.audience === 'close_friends' && (
              <View style={[styles.audienceBadge, { backgroundColor: '#10B981' }]}>
                <Ionicons name="star" size={10} color={brandColors.white} />
                <Text style={styles.audienceText}>Close Friends</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.timestamp,
              { color: 'rgba(255, 255, 255, 0.75)', fontSize: typography.fontSize.xs },
            ]}
          >
            {getRelativeTime(story.createdAt)}
          </Text>
        </View>
      </View>

      {/* Right Controls: Options and Close */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          onPress={handleOpenMenu}
          style={styles.iconButton}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Story options"
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color={brandColors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onClose}
          style={styles.iconButton}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Close story"
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color={brandColors.white} />
        </TouchableOpacity>
      </View>

      {/* Options Dropdown / Modal */}
      {isMenuOpen && (
        <Modal
          visible={isMenuOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCloseMenu}
        >
          <TouchableWithoutFeedback onPress={handleCloseMenu}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.menuSheet}>
                  {isOwner ? (
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        handleCloseMenu();
                        onDeleteStory?.();
                      }}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Delete story"
                    >
                      <Ionicons name="trash-outline" size={20} color={brandColors.pink} />
                      <Text style={[styles.menuItemText, { color: brandColors.pink }]}>
                        Delete Story
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                          handleCloseMenu();
                          onMuteUser?.();
                        }}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="Mute stories from this user"
                      >
                        <Ionicons name="volume-mute-outline" size={20} color={brandColors.white} />
                        <Text style={[styles.menuItemText, { color: brandColors.white }]}>
                          Mute @{group.username}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                          handleCloseMenu();
                          onReportStory?.();
                        }}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="Report story"
                      >
                        <Ionicons name="flag-outline" size={20} color={brandColors.pink} />
                        <Text style={[styles.menuItemText, { color: brandColors.pink }]}>
                          Report Story
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                  <TouchableOpacity
                    style={[styles.menuItem, styles.cancelItem]}
                    onPress={handleCloseMenu}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel"
                  >
                    <Text style={[styles.menuItemText, { color: 'rgba(255,255,255,0.7)' }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    width: '100%',
  },
  userInfoSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userTextSlot: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  username: {
    fontWeight: '700',
  },
  audienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  audienceText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  timestamp: {
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  menuSheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#18181B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 12,
    gap: 12,
  },
  cancelItem: {
    justifyContent: 'center',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.1)',
    marginTop: 6,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
