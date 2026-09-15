import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { Draft } from '../types';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface DraftsListViewProps {
  drafts: Draft[];
  onSelectDraft: (draft: Draft) => void;
  onDeleteDraft: (id: string) => Promise<void>;
  onBack: () => void;
  onCreateNew: () => void;
}

export const DraftsListView: React.FC<DraftsListViewProps> = ({
  drafts,
  onSelectDraft,
  onDeleteDraft,
  onBack,
  onCreateNew,
}) => {
  const { theme, typography } = useTheme();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDeleteDraft(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.background }]}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel="Saved video drafts view"
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity
          onPress={onBack}
          style={[styles.headerBtn, A11yStandards.minTouchTarget]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Back to create hub"
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text, fontSize: typography.fontSize.lg }]}>
          Saved Drafts ({drafts.length})
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      {drafts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: theme.surface }]}>
            <Ionicons name="document-text-outline" size={48} color={BrandColors.cyan} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text, fontSize: typography.fontSize.xl }]}>
            No Saved Drafts Yet
          </Text>
          <Text
            style={[
              styles.emptyDescription,
              { color: theme.textSecondary, fontSize: typography.fontSize.sm },
            ]}
          >
            Your in-progress videos, trim configurations, and captions will appear here. Drafts stay stored
            privately on this device.
          </Text>
          <TouchableOpacity
            onPress={onCreateNew}
            style={[styles.createBtn, A11yStandards.minTouchTarget, { backgroundColor: BrandColors.cyan }]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Create a new video"
          >
            <Ionicons name="add" size={20} color="#000000" />
            <Text style={styles.createBtnText}>Start Creating</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
        >
          {drafts.map((d) => {
            const isDeleting = deletingId === d.id;
            const updatedDate = new Date(d.updatedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <View
                key={d.id}
                style={[
                  styles.draftCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                accessible={true}
                accessibilityRole="none"
                accessibilityLabel={`Draft from ${updatedDate}`}
              >
                {/* Thumbnail / Frame Indicator */}
                <View style={styles.thumbnailContainer}>
                  <Ionicons name="videocam" size={28} color={BrandColors.cyan} />
                  <Text style={styles.durationBadge}>
                    {Math.round(
                      (d.editState?.trimEndSeconds || 15) - (d.editState?.trimStartSeconds || 0)
                    )}
                    s
                  </Text>
                </View>

                {/* Draft Information */}
                <View style={styles.infoContainer}>
                  <Text
                    style={[styles.draftCaption, { color: theme.text }]}
                    numberOfLines={2}
                  >
                    {d.publishConfig?.caption || 'Untitled Video Draft'}
                  </Text>
                  <Text style={[styles.draftDate, { color: theme.textSecondary }]}>
                    Updated {updatedDate}
                  </Text>

                  {/* Actions Row */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      onPress={() => onSelectDraft(d)}
                      style={[
                        styles.resumeBtn,
                        A11yStandards.minTouchTarget,
                        { backgroundColor: BrandColors.cyan },
                      ]}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Resume editing this draft"
                    >
                      <Ionicons name="create-outline" size={16} color="#000000" />
                      <Text style={styles.resumeBtnText}>Resume</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDelete(d.id)}
                      disabled={isDeleting}
                      style={[
                        styles.deleteBtn,
                        A11yStandards.minTouchTarget,
                        { borderColor: theme.border },
                      ]}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Delete this draft"
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color={BrandColors.pink}
                      />
                      <Text style={[styles.deleteBtnText, { color: BrandColors.pink }]}>
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  headerTitle: {
    fontWeight: '700',
  },
  headerSpacer: {
    width: 44,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDescription: {
    textAlign: 'center',
    lineHeight: 20,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 12,
  },
  createBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  draftCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 14,
  },
  thumbnailContainer: {
    width: 72,
    height: 96,
    backgroundColor: '#000000',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  draftCaption: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  draftDate: {
    fontSize: 12,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 44,
  },
  resumeBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
