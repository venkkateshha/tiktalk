import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { Avatar } from '../../../components/ui/Avatar';
import { StoryViewItem } from '../types';
import { storyService } from '../service';

export interface StoryViewersModalProps {
  visible: boolean;
  storyId: string;
  onClose: () => void;
}

export const StoryViewersModal: React.FC<StoryViewersModalProps> = ({
  visible,
  storyId,
  onClose,
}) => {
  const { typography, brandColors } = useTheme();
  const [viewers, setViewers] = useState<StoryViewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (visible && storyId) {
      setIsLoading(true);
      storyService
        .getStoryViewers(storyId)
        .then((items) => {
          setViewers(items);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [visible, storyId]);

  const getRelativeTime = (isoString: string): string => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <Ionicons name="eye-outline" size={20} color={brandColors.white} />
                  <Text
                    style={[
                      styles.title,
                      { color: brandColors.white, fontSize: typography.fontSize.md },
                    ]}
                  >
                    Viewers ({viewers.length})
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Close viewers list"
                >
                  <Ionicons name="close" size={22} color={brandColors.white} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              {isLoading ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator color={brandColors.cyan} size="small" />
                </View>
              ) : viewers.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={48} color="rgba(255,255,255,0.3)" />
                  <Text style={[styles.emptyTitle, { color: brandColors.white }]}>
                    No views yet
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: 'rgba(255,255,255,0.6)' }]}>
                    When someone views your story, their profile will appear here.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.list}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                >
                  {viewers.map((viewer) => (
                    <View key={viewer.viewerId} style={styles.viewerRow}>
                      <Avatar
                        source={viewer.viewerAvatarUrl}
                        name={viewer.viewerUsername}
                        size="md"
                      />
                      <View style={styles.viewerInfo}>
                        <Text style={[styles.viewerName, { color: brandColors.white }]}>
                          {viewer.viewerDisplayName}
                        </Text>
                        <Text style={[styles.viewerHandle, { color: 'rgba(255,255,255,0.6)' }]}>
                          @{viewer.viewerUsername} • {getRelativeTime(viewer.viewedAt)}
                        </Text>
                      </View>

                      {/* Reaction Icon if viewer reacted */}
                      {viewer.reaction && (
                        <View style={styles.reactionBadge}>
                          <Ionicons
                            name={viewer.reaction === 'love' ? 'heart' : 'thumbs-up'}
                            size={18}
                            color={viewer.reaction === 'love' ? brandColors.pink : brandColors.cyan}
                          />
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '70%',
    minHeight: 320,
    backgroundColor: '#18181B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontWeight: '700',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    minHeight: 220,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 14,
  },
  viewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  viewerInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  viewerName: {
    fontSize: 14,
    fontWeight: '600',
  },
  viewerHandle: {
    fontSize: 12,
    marginTop: 2,
  },
  reactionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
