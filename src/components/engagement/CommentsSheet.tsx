/**
 * TikTalk Phase 7: CommentsSheet Component
 * Responsive bottom sheet / modal for comments and replies.
 * Video playback continues underneath without interruption.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Comment, CommentReportReason, MAX_COMMENT_LENGTH } from '../../domain/engagement';
import { useTheme } from '../../theme';
import { BrandColors } from '../../theme/colors';
import { A11yStandards } from '../../core/a11y/a11yStandards';
import { useComments } from '../../features/feed/hooks/useComments';
import { CommentRow } from './CommentRow';

export interface CommentsSheetProps {
  visible: boolean;
  postId: string;
  commentCount?: number;
  onClose: () => void;
}

export const CommentsSheet: React.FC<CommentsSheetProps> = ({
  visible,
  postId,
  commentCount,
  onClose,
}) => {
  const { theme, typography } = useTheme();
  const [inputText, setInputText] = useState<string>('');
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<CommentReportReason>('spam');
  const [reportSuccessToast, setReportSuccessToast] = useState<boolean>(false);
  const inputRef = useRef<TextInput>(null);

  const {
    comments,
    isLoading,
    isSubmitting,
    hasMore,
    repliesMap,
    expandedReplies,
    replyingTo,
    loadComments,
    toggleExpandReplies,
    setReplyingTo,
    addComment,
    deleteComment,
    toggleCommentLike,
    reportComment,
  } = useComments({ postId });

  const handleReplyPress = (comment: Comment) => {
    setReplyingTo(comment);
    inputRef.current?.focus();
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleSubmitComment = async () => {
    const textToSend = inputText;
    if (!textToSend.trim() || textToSend.trim().length > MAX_COMMENT_LENGTH) return;
    setInputText('');
    await addComment(textToSend);
  };

  const handleOpenReport = (commentId: string) => {
    setReportCommentId(commentId);
  };

  const handleConfirmReport = async () => {
    if (reportCommentId) {
      await reportComment(reportCommentId, reportReason);
      setReportCommentId(null);
      setReportSuccessToast(true);
      setTimeout(() => setReportSuccessToast(false), 2500);
    }
  };

  const charCount = inputText.length;
  const isOverLimit = charCount > MAX_COMMENT_LENGTH;
  const isSendDisabled =
    !inputText.trim() || isOverLimit || isSubmitting;

  const totalCount =
    typeof commentCount === 'number'
      ? Math.max(commentCount, comments.length)
      : comments.length;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        {/* Dismissable outer backdrop */}
        <TouchableOpacity
          style={styles.dismissOverlay}
          activeOpacity={1}
          onPress={onClose}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Dismiss comments overlay"
        />

        {/* Sheet Content Container */}
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
          accessible={true}
          accessibilityRole="none"
          accessibilityViewIsModal={true}
          accessibilityLabel="Comments sheet"
        >
          {/* Header Bar */}
          <View style={[styles.headerBar, { borderBottomColor: theme.border }]}>
            <View style={styles.headerTitleRow}>
              <Text
                style={[
                  styles.headerTitle,
                  { color: theme.text, fontSize: typography.fontSize.md },
                ]}
              >
                Comments {totalCount > 0 ? `(${totalCount})` : ''}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeButton, A11yStandards.minTouchTarget]}
              onPress={onClose}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close comments"
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Toast Notice */}
          {reportSuccessToast && (
            <View style={styles.toastNotice}>
              <Text style={styles.toastNoticeText}>
                Report submitted. Thank you for keeping TikTalk safe.
              </Text>
            </View>
          )}

          {/* Comments List */}
          {isLoading && comments.length === 0 ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={BrandColors.cyan} />
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={48}
                color={theme.textSecondary}
              />
              <Text
                style={[
                  styles.emptyTitle,
                  { color: theme.text, fontSize: typography.fontSize.md },
                ]}
              >
                No comments yet
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: theme.textSecondary, fontSize: typography.fontSize.sm },
                ]}
              >
                Be the first to share your thoughts!
              </Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <CommentRow
                  comment={item}
                  replies={repliesMap[item.id] || []}
                  isRepliesExpanded={expandedReplies.has(item.id)}
                  onToggleExpandReplies={toggleExpandReplies}
                  onReplyPress={handleReplyPress}
                  onLikePress={toggleCommentLike}
                  onDeletePress={deleteComment}
                  onReportPress={handleOpenReport}
                />
              )}
              onEndReached={() => {
                if (hasMore && !isLoading) {
                  loadComments(undefined, true);
                }
              }}
              contentContainerStyle={styles.listContent}
            />
          )}

          {/* Active Reply Banner */}
          {replyingTo && (
            <View
              style={[
                styles.replyingBanner,
                { backgroundColor: theme.card, borderTopColor: theme.border },
              ]}
            >
              <Text
                style={[styles.replyingText, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                Replying to{' '}
                <Text style={{ color: BrandColors.cyan, fontWeight: '600' }}>
                  @{replyingTo.author?.displayName || replyingTo.author?.username || 'User'}
                </Text>
              </Text>
              <TouchableOpacity
                style={[styles.cancelReplyBtn, A11yStandards.minTouchTarget]}
                onPress={handleCancelReply}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Cancel reply"
              >
                <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Input Bar */}
          <View
            style={[
              styles.inputBar,
              {
                backgroundColor: theme.surface,
                borderTopColor: theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.background,
                  borderColor: isOverLimit ? BrandColors.pink : theme.border,
                },
              ]}
            >
              <TextInput
                ref={inputRef}
                style={[
                  styles.textInput,
                  { color: theme.text, fontSize: typography.fontSize.sm },
                ]}
                placeholder={
                  replyingTo
                    ? `Reply to @${replyingTo.author?.displayName || 'User'}...`
                    : 'Add a comment...'
                }
                placeholderTextColor={theme.textSecondary}
                value={inputText}
                onChangeText={setInputText}
                multiline={false}
                maxLength={MAX_COMMENT_LENGTH + 20}
                returnKeyType="send"
                onSubmitEditing={handleSubmitComment}
              />
              <Text
                style={[
                  styles.charCounter,
                  {
                    color: isOverLimit
                      ? BrandColors.pink
                      : charCount > 250
                      ? BrandColors.cyan
                      : theme.textSecondary,
                  },
                ]}
              >
                {charCount}/{MAX_COMMENT_LENGTH}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.sendButton,
                A11yStandards.minTouchTarget,
                {
                  backgroundColor: isSendDisabled
                    ? theme.border
                    : BrandColors.pink,
                },
              ]}
              disabled={isSendDisabled}
              onPress={handleSubmitComment}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Post comment"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={BrandColors.white} />
              ) : (
                <Ionicons name="arrow-up" size={20} color={BrandColors.white} />
              )}
            </TouchableOpacity>
          </View>

          {/* Report Reason Modal */}
          {reportCommentId && (
            <Modal
              visible={true}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setReportCommentId(null)}
            >
              <View style={styles.reportBackdrop}>
                <View
                  style={[
                    styles.reportCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.reportTitle,
                      { color: theme.text, fontSize: typography.fontSize.md },
                    ]}
                  >
                    Report Comment
                  </Text>
                  <Text
                    style={[
                      styles.reportSubtitle,
                      { color: theme.textSecondary, fontSize: typography.fontSize.xs },
                    ]}
                  >
                    Select the reason for reporting this comment:
                  </Text>

                  {(
                    [
                      { key: 'spam', label: 'Spam or misleading' },
                      { key: 'harassment', label: 'Harassment or bullying' },
                      { key: 'hate_speech', label: 'Hate speech' },
                      { key: 'sexual_content', label: 'Inappropriate sexual content' },
                      { key: 'violence', label: 'Violence or dangerous acts' },
                      { key: 'scam', label: 'Scam or fraud' },
                      { key: 'other', label: 'Other issue' },
                    ] as const
                  ).map((reason) => {
                    const isSelected = reportReason === reason.key;
                    return (
                      <TouchableOpacity
                        key={reason.key}
                        style={[
                          styles.reportOption,
                          A11yStandards.minTouchTarget,
                          isSelected && { backgroundColor: theme.card },
                        ]}
                        onPress={() => setReportReason(reason.key)}
                        accessible={true}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                      >
                        <Ionicons
                          name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                          size={18}
                          color={isSelected ? BrandColors.cyan : theme.textSecondary}
                        />
                        <Text
                          style={[
                            styles.reportOptionText,
                            { color: theme.text, fontSize: typography.fontSize.sm },
                          ]}
                        >
                          {reason.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                  <View style={styles.reportButtonRow}>
                    <TouchableOpacity
                      style={[
                        styles.reportCancelBtn,
                        A11yStandards.minTouchTarget,
                        { borderColor: theme.border },
                      ]}
                      onPress={() => setReportCommentId(null)}
                      accessible={true}
                      accessibilityRole="button"
                    >
                      <Text style={{ color: theme.textSecondary }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.reportSubmitBtn,
                        A11yStandards.minTouchTarget,
                        { backgroundColor: BrandColors.pink },
                      ]}
                      onPress={handleConfirmReport}
                      accessible={true}
                      accessibilityRole="button"
                    >
                      <Text style={{ color: BrandColors.white, fontWeight: '700' }}>
                        Submit Report
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const { height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  dismissOverlay: {
    flex: 1,
  },
  sheetContainer: {
    maxHeight: screenHeight * 0.72,
    minHeight: 380,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleRow: {
    flex: 1,
    alignItems: 'center',
    paddingLeft: 24,
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
  listContent: {
    paddingBottom: 20,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 220,
  },
  emptyTitle: {
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    marginTop: 6,
    textAlign: 'center',
  },
  replyingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  replyingText: {
    fontSize: 12,
  },
  cancelReplyBtn: {
    padding: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  textInput: {
    flex: 1,
    paddingVertical: 4,
  },
  charCounter: {
    fontSize: 11,
    marginLeft: 6,
    fontWeight: '600',
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastNotice: {
    backgroundColor: BrandColors.cyan,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  toastNoticeText: {
    color: BrandColors.black,
    fontWeight: '700',
    fontSize: 12,
  },
  reportBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  reportCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  reportTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  reportSubtitle: {
    marginBottom: 16,
  },
  reportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  reportOptionText: {},
  reportButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 18,
  },
  reportCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
  },
  reportSubmitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
});
