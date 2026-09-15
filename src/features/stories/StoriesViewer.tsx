import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useNavigation } from '../../navigation';
import { Avatar } from '../../components/ui/Avatar';
import { StoriesRouteParams } from '../../navigation/types';

export interface StoriesViewerProps {
  params: StoriesRouteParams;
}

export const StoriesViewer: React.FC<StoriesViewerProps> = ({ params }) => {
  const { theme, typography, brandColors } = useTheme();
  const { closeStories } = useNavigation();
  const [progress, setProgress] = useState(0.35);

  return (
    <SafeAreaView
      style={[styles.overlay, { backgroundColor: brandColors.black }]}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel={`Story viewer for user ${params.userId}`}
    >
      {/* Top Story Header */}
      <View style={styles.topBar}>
        {/* Progress bar indicator */}
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarActive,
              { width: `${progress * 100}%`, backgroundColor: brandColors.cyan },
            ]}
          />
        </View>

        <View style={styles.headerInfoRow}>
          <View style={styles.userInfoRow}>
            <Avatar name={params.userId} size="sm" isVerified={true} />
            <View style={styles.userTextSlot}>
              <Text style={[styles.userName, { color: brandColors.white, fontSize: typography.fontSize.sm }]}>
                @{params.userId}
              </Text>
              <Text style={[styles.timestamp, { color: 'rgba(255,255,255,0.7)', fontSize: typography.fontSize.xs }]}>
                2h ago • {params.entryPoint === 'home_rail' ? 'From Feed' : 'From Profile'}
              </Text>
            </View>
          </View>

          {/* Close button */}
          <TouchableOpacity
            onPress={closeStories}
            style={styles.closeButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Close stories"
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={24} color={brandColors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Story Center Visual Viewport */}
      <View style={styles.contentArea}>
        <View style={styles.storyCard}>
          <Ionicons name="sparkles" size={48} color={brandColors.cyan} />
          <Text style={[styles.storyPrompt, { color: brandColors.white, fontSize: typography.fontSize.lg }]}>
            Ephemeral Story View
          </Text>
          <Text
            style={[
              styles.storyNote,
              { color: 'rgba(255,255,255,0.7)', fontSize: typography.fontSize.sm },
            ]}
          >
            Stories expire after 24 hours. Accessible from Home Feed and Profile.
          </Text>
        </View>
      </View>

      {/* Bottom Action / Reply bar */}
      <View style={styles.bottomBar}>
        <View style={styles.replyInputSlot}>
          <Text style={[styles.replyPlaceholder, { color: 'rgba(255,255,255,0.5)', fontSize: typography.fontSize.sm }]}>
            Send a message to @{params.userId}...
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {}}
          style={styles.actionIcon}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Like story"
        >
          <Ionicons name="heart-outline" size={26} color={brandColors.pink} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {}}
          style={styles.actionIcon}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Share story"
        >
          <Ionicons name="paper-plane-outline" size={24} color={brandColors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'space-between',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarActive: {
    height: '100%',
  },
  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userTextSlot: {
    marginLeft: 10,
  },
  userName: {
    fontWeight: '700',
  },
  timestamp: {
    fontWeight: '400',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  storyCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    maxWidth: 380,
    width: '100%',
  },
  storyPrompt: {
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  storyNote: {
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  replyInputSlot: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  replyPlaceholder: {
    fontWeight: '400',
  },
  actionIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
