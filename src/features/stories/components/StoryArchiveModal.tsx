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
import { StoryArchiveItem } from '../types';
import { storyService } from '../service';

export interface StoryArchiveModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectStory?: (archiveItem: StoryArchiveItem) => void;
}

export const StoryArchiveModal: React.FC<StoryArchiveModalProps> = ({
  visible,
  onClose,
  onSelectStory,
}) => {
  const { typography, brandColors } = useTheme();
  const [items, setItems] = useState<StoryArchiveItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      storyService
        .getArchive()
        .then((res) => setItems(res))
        .finally(() => setIsLoading(false));
    }
  }, [visible]);

  // Group items by Month & Year
  const groupedItems = items.reduce<Record<string, StoryArchiveItem[]>>((acc, item) => {
    const d = new Date(item.archivedAt);
    const monthYear = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(item);
    return acc;
  }, {});

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
                  <Ionicons name="archive-outline" size={20} color={brandColors.cyan} />
                  <Text
                    style={[
                      styles.title,
                      { color: brandColors.white, fontSize: typography.fontSize.md },
                    ]}
                  >
                    Story Archive
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Close archive modal"
                >
                  <Ionicons name="close" size={22} color={brandColors.white} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              {isLoading ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator color={brandColors.cyan} size="small" />
                </View>
              ) : items.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="archive-outline" size={48} color="rgba(255,255,255,0.3)" />
                  <Text style={[styles.emptyTitle, { color: brandColors.white }]}>
                    No archived stories
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: 'rgba(255,255,255,0.6)' }]}>
                    Your expired stories will be privately saved here after 24 hours.
                  </Text>
                </View>
              ) : (
                <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                  {Object.entries(groupedItems).map(([monthYear, group]) => (
                    <View key={monthYear} style={styles.groupSection}>
                      <Text style={[styles.groupTitle, { color: brandColors.cyan }]}>
                        {monthYear}
                      </Text>
                      <View style={styles.grid}>
                        {group.map((item) => (
                          <TouchableOpacity
                            key={item.id}
                            onPress={() => onSelectStory?.(item)}
                            style={[
                              styles.storyCard,
                              { backgroundColor: item.story.textBackground || '#27272A' },
                            ]}
                            accessible={true}
                            accessibilityRole="button"
                            accessibilityLabel={`Archived story from ${new Date(item.archivedAt).toLocaleDateString()}`}
                            activeOpacity={0.8}
                          >
                            <Text
                              numberOfLines={3}
                              style={[styles.cardText, { color: brandColors.white }]}
                            >
                              {item.story.textContent || `${item.story.type} story`}
                            </Text>
                            <View style={styles.cardFooter}>
                              <Ionicons name="eye-outline" size={12} color="rgba(255,255,255,0.7)" />
                              <Text style={styles.cardViewsText}>{item.story.viewCount}</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
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
    maxWidth: 550,
    maxHeight: '80%',
    minHeight: 350,
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
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  groupSection: {
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  storyCard: {
    width: '31%',
    aspectRatio: 9 / 16,
    borderRadius: 10,
    padding: 8,
    justifyContent: 'space-between',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardText: {
    fontSize: 11,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardViewsText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '600',
  },
});
