import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { Badge } from '../../../components/ui/Badge';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface CreateHubViewProps {
  onRecordVideo: () => void;
  onUploadVideo: () => void;
  onOpenDrafts: () => void;
  draftsCount: number;
}

export const CreateHubView: React.FC<CreateHubViewProps> = ({
  onRecordVideo,
  onUploadVideo,
  onOpenDrafts,
  draftsCount,
}) => {
  const { theme, typography } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Studio Banner */}
      <View style={styles.banner}>
        <Badge label="TIKTALK STUDIO" variant="primary" />
        <Text style={[styles.title, { color: theme.text, fontSize: typography.fontSize.xl }]}>
          Creation Studio
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary, fontSize: typography.fontSize.sm }]}>
          Produce high-quality 60 FPS vertical shorts with automated weekly UPI creator rev-share.
        </Text>
      </View>

      {/* Primary Action 1: Record Video */}
      <TouchableOpacity
        onPress={onRecordVideo}
        style={[
          styles.actionCard,
          { backgroundColor: theme.surface, borderColor: BrandColors.cyan },
          A11yStandards.minTouchTarget,
        ]}
        activeOpacity={0.8}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Record video with camera"
      >
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(37, 244, 238, 0.12)' }]}>
          <Ionicons name="videocam" size={28} color={BrandColors.cyan} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: theme.text, fontSize: typography.fontSize.base }]}>
            Record Video
          </Text>
          <Text style={[styles.cardDesc, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]}>
            Full-screen camera with 15s, 60s, and 3m modes, speed control, and live PTS audio sync.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={BrandColors.cyan} />
      </TouchableOpacity>

      {/* Primary Action 2: Upload Video */}
      <TouchableOpacity
        onPress={onUploadVideo}
        style={[
          styles.actionCard,
          { backgroundColor: theme.surface, borderColor: BrandColors.pink },
          A11yStandards.minTouchTarget,
        ]}
        activeOpacity={0.8}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Upload video from device library"
      >
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(254, 44, 85, 0.12)' }]}>
          <Ionicons name="cloud-upload" size={28} color={BrandColors.pink} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: theme.text, fontSize: typography.fontSize.base }]}>
            Upload Video
          </Text>
          <Text style={[styles.cardDesc, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]}>
            Select vertical MP4, WebM, or MOV files up to 500 MB directly from your device.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={BrandColors.pink} />
      </TouchableOpacity>

      {/* Secondary Action: Drafts */}
      <TouchableOpacity
        onPress={onOpenDrafts}
        style={[
          styles.draftsCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
          A11yStandards.minTouchTarget,
        ]}
        activeOpacity={0.8}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`View saved drafts, ${draftsCount} available`}
      >
        <View style={styles.draftsLeft}>
          <View style={[styles.draftsIconWrap, { backgroundColor: theme.card }]}>
            <Ionicons name="document-text-outline" size={20} color={theme.text} />
          </View>
          <View>
            <Text style={[styles.draftsTitle, { color: theme.text, fontSize: typography.fontSize.sm }]}>
              Saved Drafts
            </Text>
            <Text style={[styles.draftsSubtitle, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]}>
              {draftsCount === 1 ? '1 draft stored locally' : `${draftsCount} drafts stored locally`}
            </Text>
          </View>
        </View>
        <Badge label={String(draftsCount)} variant={draftsCount > 0 ? 'accent' : 'neutral'} />
      </TouchableOpacity>

      {/* Specifications Card */}
      <View style={[styles.specCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.specTitle, { color: theme.text, fontSize: typography.fontSize.xs }]}>
          Studio Architecture Specifications
        </Text>
        <Text style={[styles.specDesc, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]}>
          720p/1080p H.265 Hardware Encoding • Cloudflare R2 Ingestion • Sub-1s Segment Transcoding
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  banner: {
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  title: {
    fontWeight: '800',
    marginTop: 10,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 6,
    lineHeight: 18,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDesc: {
    lineHeight: 16,
  },
  draftsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  draftsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  draftsIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftsTitle: {
    fontWeight: '700',
  },
  draftsSubtitle: {
    marginTop: 2,
  },
  specCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  specTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  specDesc: {
    textAlign: 'center',
    lineHeight: 15,
  },
});
