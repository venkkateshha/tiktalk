import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { PublishConfig } from '../types';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface PublishDetailsViewProps {
  publishConfig: PublishConfig;
  onUpdatePublishConfig: (updater: Partial<PublishConfig>) => void;
  onBackToEdit: () => void;
  onSaveDraft: () => Promise<void>;
  onPublish: () => Promise<void>;
  isPublishing?: boolean;
}

export const PublishDetailsView: React.FC<PublishDetailsViewProps> = ({
  publishConfig,
  onUpdatePublishConfig,
  onBackToEdit,
  onSaveDraft,
  onPublish,
  isPublishing = false,
}) => {
  const { theme, typography } = useTheme();
  const [tagInput, setTagInput] = useState<string>('');
  const [draftSavedToast, setDraftSavedToast] = useState<boolean>(false);

  const audiences: PublishConfig['audience'][] = ['public', 'friends', 'private'];

  const handleAddHashtag = (tagToAdd?: string) => {
    const raw = tagToAdd || tagInput;
    const clean = raw.replace(/^#/, '').trim();
    if (!clean) return;
    if (!publishConfig.hashtags.includes(clean)) {
      onUpdatePublishConfig({
        hashtags: [...publishConfig.hashtags, clean],
      });
    }
    setTagInput('');
  };

  const handleRemoveHashtag = (tagToRemove: string) => {
    onUpdatePublishConfig({
      hashtags: publishConfig.hashtags.filter((t) => t !== tagToRemove),
    });
  };

  const handleSaveDraftClick = async () => {
    await onSaveDraft();
    setDraftSavedToast(true);
    setTimeout(() => {
      setDraftSavedToast(false);
    }, 2000);
  };

  // Schedule preset helpers
  const setScheduleOffsetHours = (hours: number) => {
    const d = new Date(Date.now() + hours * 3600 * 1000);
    onUpdatePublishConfig({
      schedule: {
        enabled: true,
        publishAt: d.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      },
    });
  };

  const toggleScheduling = () => {
    if (publishConfig.schedule.enabled) {
      onUpdatePublishConfig({
        schedule: { enabled: false, publishAt: undefined },
      });
    } else {
      setScheduleOffsetHours(2);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.background }]}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel="Publish video details view"
    >
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity
          onPress={onBackToEdit}
          style={[styles.headerBtn, A11yStandards.minTouchTarget]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Back to edit video"
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text, fontSize: typography.fontSize.lg }]}>
          Post Video
        </Text>
        <TouchableOpacity
          onPress={handleSaveDraftClick}
          style={[styles.saveDraftBtn, A11yStandards.minTouchTarget]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Save as draft"
        >
          <Text style={[styles.saveDraftText, { color: BrandColors.cyan, fontSize: typography.fontSize.sm }]}>
            {draftSavedToast ? 'Draft Saved!' : 'Save Draft'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Caption Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            CAPTION & HASHTAGS
          </Text>
          <TextInput
            style={[
              styles.captionInput,
              {
                color: theme.text,
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
            placeholder="Describe your video, add context, tag friends..."
            placeholderTextColor={theme.textMuted}
            value={publishConfig.caption}
            onChangeText={(caption) => onUpdatePublishConfig({ caption })}
            multiline={true}
            numberOfLines={4}
            maxLength={500}
            accessible={true}
            accessibilityLabel="Video caption input"
          />
          <View style={styles.captionFooter}>
            <View style={styles.quickTagsRow}>
              {['#viral', '#tiktalk', '#creator', '#trending'].map((tag) => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => handleAddHashtag(tag)}
                  style={[styles.quickTagChip, { backgroundColor: theme.card }]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Add hashtag ${tag}`}
                >
                  <Text style={[styles.quickTagText, { color: BrandColors.cyan }]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.charCount, { color: theme.textMuted }]}>
              {publishConfig.caption.length} / 500
            </Text>
          </View>

          {/* Active Hashtags Pills */}
          {publishConfig.hashtags.length > 0 && (
            <View style={styles.hashtagsPillRow}>
              {publishConfig.hashtags.map((h) => (
                <View
                  key={h}
                  style={[styles.hashtagPill, { backgroundColor: theme.card }]}
                >
                  <Text style={[styles.hashtagPillText, { color: BrandColors.cyan }]}>#{h}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveHashtag(h)}
                    style={styles.pillClose}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove hashtag ${h}`}
                  >
                    <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Audience Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            WHO CAN VIEW THIS VIDEO
          </Text>
          <View style={styles.audienceRow}>
            {audiences.map((aud) => {
              const isSelected = publishConfig.audience === aud;
              return (
                <TouchableOpacity
                  key={aud}
                  onPress={() => onUpdatePublishConfig({ audience: aud })}
                  style={[
                    styles.audienceCard,
                    A11yStandards.minTouchTarget,
                    {
                      backgroundColor: isSelected ? theme.surface : theme.card,
                      borderColor: isSelected ? BrandColors.cyan : theme.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  accessible={true}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Audience ${aud}`}
                >
                  <Ionicons
                    name={
                      aud === 'public'
                        ? 'earth'
                        : aud === 'friends'
                        ? 'people'
                        : 'lock-closed'
                    }
                    size={22}
                    color={isSelected ? BrandColors.cyan : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.audienceLabel,
                      { color: isSelected ? theme.text : theme.textSecondary, fontWeight: isSelected ? '700' : '500' },
                    ]}
                  >
                    {aud.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Interaction Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            INTERACTIONS & PERMISSIONS
          </Text>
          <View style={[styles.settingsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Comments */}
            <View style={styles.settingItem}>
              <View style={styles.settingItemLeft}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.text} />
                <Text style={[styles.settingLabel, { color: theme.text }]}>Allow Comments</Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  onUpdatePublishConfig({ commentsAllowed: !publishConfig.commentsAllowed })
                }
                style={[
                  styles.toggleBadge,
                  A11yStandards.minTouchTarget,
                  {
                    backgroundColor: publishConfig.commentsAllowed
                      ? BrandColors.cyan
                      : theme.card,
                  },
                ]}
                accessible={true}
                accessibilityRole="switch"
                accessibilityLabel="Toggle allow comments"
                accessibilityState={{ checked: publishConfig.commentsAllowed }}
              >
                <Text
                  style={[
                    styles.toggleText,
                    { color: publishConfig.commentsAllowed ? '#000000' : theme.textSecondary },
                  ]}
                >
                  {publishConfig.commentsAllowed ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Remix */}
            <View style={[styles.settingItem, { borderTopWidth: 1, borderTopColor: theme.border }]}>
              <View style={styles.settingItemLeft}>
                <Ionicons name="git-branch-outline" size={20} color={theme.text} />
                <Text style={[styles.settingLabel, { color: theme.text }]}>Allow Remix / Duet</Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  onUpdatePublishConfig({ remixAllowed: !publishConfig.remixAllowed })
                }
                style={[
                  styles.toggleBadge,
                  A11yStandards.minTouchTarget,
                  {
                    backgroundColor: publishConfig.remixAllowed
                      ? BrandColors.cyan
                      : theme.card,
                  },
                ]}
                accessible={true}
                accessibilityRole="switch"
                accessibilityLabel="Toggle allow remix"
                accessibilityState={{ checked: publishConfig.remixAllowed }}
              >
                <Text
                  style={[
                    styles.toggleText,
                    { color: publishConfig.remixAllowed ? '#000000' : theme.textSecondary },
                  ]}
                >
                  {publishConfig.remixAllowed ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Save / Downloads */}
            <View style={[styles.settingItem, { borderTopWidth: 1, borderTopColor: theme.border }]}>
              <View style={styles.settingItemLeft}>
                <Ionicons name="download-outline" size={20} color={theme.text} />
                <Text style={[styles.settingLabel, { color: theme.text }]}>Allow Downloads</Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  onUpdatePublishConfig({ saveAllowed: !publishConfig.saveAllowed })
                }
                style={[
                  styles.toggleBadge,
                  A11yStandards.minTouchTarget,
                  {
                    backgroundColor: publishConfig.saveAllowed
                      ? BrandColors.cyan
                      : theme.card,
                  },
                ]}
                accessible={true}
                accessibilityRole="switch"
                accessibilityLabel="Toggle allow video downloads"
                accessibilityState={{ checked: publishConfig.saveAllowed }}
              >
                <Text
                  style={[
                    styles.toggleText,
                    { color: publishConfig.saveAllowed ? '#000000' : theme.textSecondary },
                  ]}
                >
                  {publishConfig.saveAllowed ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Scheduling Section */}
        <View style={styles.section}>
          <View style={styles.scheduleHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              SCHEDULE PUBLICATION
            </Text>
            <TouchableOpacity
              onPress={toggleScheduling}
              style={[
                styles.toggleBadge,
                A11yStandards.minTouchTarget,
                {
                  backgroundColor: publishConfig.schedule.enabled
                    ? BrandColors.pink
                    : theme.card,
                },
              ]}
              accessible={true}
              accessibilityRole="switch"
              accessibilityLabel="Toggle post scheduling"
              accessibilityState={{ checked: publishConfig.schedule.enabled }}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: publishConfig.schedule.enabled ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                {publishConfig.schedule.enabled ? 'SCHEDULED' : 'POST NOW'}
              </Text>
            </TouchableOpacity>
          </View>

          {publishConfig.schedule.enabled && (
            <View style={[styles.scheduleCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.schedulePrompt, { color: theme.text }]}>
                Publish at:{' '}
                <Text style={{ color: BrandColors.pink, fontWeight: '700' }}>
                  {publishConfig.schedule.publishAt
                    ? new Date(publishConfig.schedule.publishAt).toLocaleString()
                    : 'Select time'}
                </Text>
              </Text>
              <Text style={[styles.timezoneHint, { color: theme.textSecondary }]}>
                Timezone: {publishConfig.schedule.timezone || 'UTC'}
              </Text>

              {/* Offset Presets */}
              <View style={styles.offsetRow}>
                {[1, 6, 24].map((hours) => (
                  <TouchableOpacity
                    key={hours}
                    onPress={() => setScheduleOffsetHours(hours)}
                    style={[styles.offsetChip, A11yStandards.minTouchTarget, { backgroundColor: theme.card }]}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Schedule in ${hours} hours`}
                  >
                    <Text style={[styles.offsetText, { color: BrandColors.pink }]}>
                      +{hours} hr{hours > 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Dock */}
      <View style={[styles.footer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity
          onPress={onPublish}
          disabled={isPublishing}
          style={[
            styles.publishButton,
            A11yStandards.minTouchTarget,
            {
              backgroundColor: publishConfig.schedule.enabled ? BrandColors.pink : BrandColors.cyan,
              opacity: isPublishing ? 0.6 : 1,
            },
          ]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={publishConfig.schedule.enabled ? 'Schedule post' : 'Post video now'}
        >
          <Ionicons
            name={publishConfig.schedule.enabled ? 'time-outline' : 'paper-plane-outline'}
            size={22}
            color={publishConfig.schedule.enabled ? '#FFFFFF' : '#000000'}
          />
          <Text
            style={[
              styles.publishButtonText,
              { color: publishConfig.schedule.enabled ? '#FFFFFF' : '#000000' },
            ]}
          >
            {isPublishing
              ? 'Publishing...'
              : publishConfig.schedule.enabled
              ? 'Schedule Post'
              : 'Post Video'}
          </Text>
        </TouchableOpacity>
      </View>
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
  saveDraftBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 8,
  },
  saveDraftText: {
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 24,
    paddingBottom: 40,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  captionInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  captionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  quickTagsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  quickTagChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quickTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  charCount: {
    fontSize: 11,
  },
  hashtagsPillRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  hashtagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  hashtagPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pillClose: {
    padding: 2,
  },
  audienceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  audienceCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
    minHeight: 44,
  },
  audienceLabel: {
    fontSize: 12,
  },
  settingsCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 64,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    marginTop: 8,
  },
  schedulePrompt: {
    fontSize: 14,
  },
  timezoneHint: {
    fontSize: 12,
  },
  offsetRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  offsetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  offsetText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 24,
    minHeight: 48,
  },
  publishButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
