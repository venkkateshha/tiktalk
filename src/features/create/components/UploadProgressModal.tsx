import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { UploadState, UploadProgressEvent } from '../types';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface UploadProgressModalProps {
  uploadState: UploadState;
  uploadProgress: UploadProgressEvent | null;
  errorMessage: string | null;
  onCancel: () => void;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const UploadProgressModal: React.FC<UploadProgressModalProps> = ({
  uploadState,
  uploadProgress,
  errorMessage,
  onCancel,
  onRetry,
  onDismiss,
}) => {
  const { theme, typography } = useTheme();

  const isVisible =
    uploadState === 'uploading' ||
    uploadState === 'processing' ||
    uploadState === 'publishing' ||
    uploadState === 'success' ||
    uploadState === 'failed' ||
    uploadState === 'cancelled' ||
    uploadState === 'offline' ||
    uploadState === 'unavailable';

  if (!isVisible) return null;

  const isError =
    uploadState === 'failed' ||
    uploadState === 'offline' ||
    uploadState === 'unavailable';

  const isSuccess = uploadState === 'success';

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const percentage = uploadProgress ? Math.min(100, Math.max(0, uploadProgress.percentage)) : 0;

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLabel="Upload status dialog"
        >
          {/* Status Icon */}
          <View style={styles.iconContainer}>
            {isSuccess ? (
              <View style={[styles.statusCircle, { backgroundColor: BrandColors.cyan }]}>
                <Ionicons name="checkmark-sharp" size={32} color="#000000" />
              </View>
            ) : isError ? (
              <View style={[styles.statusCircle, { backgroundColor: BrandColors.pink }]}>
                <Ionicons name="alert-sharp" size={32} color="#FFFFFF" />
              </View>
            ) : uploadState === 'cancelled' ? (
              <View style={[styles.statusCircle, { backgroundColor: theme.card }]}>
                <Ionicons name="close" size={32} color={theme.text} />
              </View>
            ) : (
              <View style={[styles.statusCircle, { backgroundColor: theme.card }]}>
                <ActivityIndicator size="large" color={BrandColors.cyan} />
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.text, fontSize: typography.fontSize.lg }]}>
            {isSuccess
              ? 'Video Published!'
              : uploadState === 'uploading'
              ? 'Uploading Video...'
              : uploadState === 'processing'
              ? 'Processing & Transcoding...'
              : uploadState === 'publishing'
              ? 'Finalizing Post...'
              : uploadState === 'cancelled'
              ? 'Upload Cancelled'
              : uploadState === 'offline'
              ? 'You Are Offline'
              : uploadState === 'unavailable'
              ? 'Upload Service Unavailable'
              : 'Publish Failed'}
          </Text>

          {/* Subtitle / Step Description */}
          <Text
            style={[
              styles.description,
              { color: isError ? BrandColors.pink : theme.textSecondary },
            ]}
          >
            {isError
              ? errorMessage || 'An unexpected error occurred while communicating with the server.'
              : isSuccess
              ? 'Your video is now live in the TikTalk feed.'
              : uploadState === 'cancelled'
              ? 'The upload process was cancelled.'
              : uploadProgress?.step || 'Preparing chunks and communicating with media server...'}
          </Text>

          {/* Progress Bar (during uploading) */}
          {uploadState === 'uploading' && (
            <View style={styles.progressSection}>
              <View style={[styles.progressBarTrack, { backgroundColor: theme.card }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${percentage}%`,
                      backgroundColor: BrandColors.cyan,
                    },
                  ]}
                />
              </View>
              <View style={styles.progressMeta}>
                <Text style={[styles.progressPct, { color: BrandColors.cyan }]}>
                  {percentage}%
                </Text>
                {uploadProgress && uploadProgress.totalBytes > 0 && (
                  <Text style={[styles.progressBytes, { color: theme.textSecondary }]}>
                    {formatBytes(uploadProgress.loadedBytes)} / {formatBytes(uploadProgress.totalBytes)}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsRow}>
            {isSuccess ? (
              <TouchableOpacity
                onPress={onDismiss || onCancel}
                style={[
                  styles.primaryBtn,
                  A11yStandards.minTouchTarget,
                  { backgroundColor: BrandColors.cyan },
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Done and return to feed"
              >
                <Text style={[styles.primaryBtnText, { color: '#000000' }]}>Done</Text>
              </TouchableOpacity>
            ) : isError ? (
              <>
                {onRetry && (
                  <TouchableOpacity
                    onPress={onRetry}
                    style={[
                      styles.primaryBtn,
                      A11yStandards.minTouchTarget,
                      { backgroundColor: BrandColors.cyan, flex: 1 },
                    ]}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Retry video upload"
                  >
                    <Text style={[styles.primaryBtnText, { color: '#000000' }]}>Retry</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={onDismiss || onCancel}
                  style={[
                    styles.secondaryBtn,
                    A11yStandards.minTouchTarget,
                    { borderColor: theme.border, flex: 1 },
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss error"
                >
                  <Text style={[styles.secondaryBtnText, { color: theme.text }]}>Dismiss</Text>
                </TouchableOpacity>
              </>
            ) : uploadState === 'cancelled' ? (
              <TouchableOpacity
                onPress={onDismiss || onCancel}
                style={[
                  styles.primaryBtn,
                  A11yStandards.minTouchTarget,
                  { backgroundColor: theme.card },
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Dismiss cancellation"
              >
                <Text style={[styles.primaryBtnText, { color: theme.text }]}>Dismiss</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={onCancel}
                style={[
                  styles.cancelBtn,
                  A11yStandards.minTouchTarget,
                  { borderColor: theme.border },
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Cancel video upload"
              >
                <Text style={[styles.cancelBtnText, { color: BrandColors.pink }]}>
                  Cancel Upload
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  progressSection: {
    width: '100%',
    gap: 8,
  },
  progressBarTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPct: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBytes: {
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cancelBtn: {
    width: '100%',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
