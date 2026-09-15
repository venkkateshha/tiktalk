import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { UserProfile } from '../types';
import { useEditProfile } from '../hooks/useEditProfile';
import { Avatar } from '../../../components/ui/Avatar';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface EditProfileModalProps {
  visible: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSaveSuccess: (updated: UserProfile) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  profile,
  onClose,
  onSaveSuccess,
}) => {
  const { theme, typography } = useTheme();
  const [showDiscardAlert, setShowDiscardAlert] = useState<boolean>(false);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);

  const {
    form,
    errors,
    isValid,
    isDirty,
    isSaving,
    saveError,
    setField,
    save,
    reset,
  } = useEditProfile(profile, undefined, (updated) => {
    onSaveSuccess(updated);
    onClose();
  });

  const handleCancel = () => {
    if (isDirty) {
      setShowDiscardAlert(true);
    } else {
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardAlert(false);
    reset();
    onClose();
  };

  const handleChangePhoto = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          const objectUrl = URL.createObjectURL(file);
          setField('avatarUri', objectUrl);
          setPhotoNotice('Local image preview loaded');
          setTimeout(() => setPhotoNotice(null), 3000);
        }
      };
      input.click();
    } else {
      setPhotoNotice('Cloud media storage unseeded. Photo changes remain local on this device.');
      setTimeout(() => setPhotoNotice(null), 3000);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleCancel}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Close edit modal backdrop"
        />
        <View
          style={[
            styles.sheetContainer,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          accessible={true}
          accessibilityRole="none"
          accessibilityLabel="Edit profile dialog"
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity
              onPress={handleCancel}
              style={[styles.headerBtn, A11yStandards.minTouchTarget]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Cancel edit profile"
            >
              <Text style={[styles.cancelText, { color: theme.textSecondary, fontSize: typography.fontSize.sm }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <Text style={[styles.title, { color: theme.text, fontSize: typography.fontSize.lg }]}>
              Edit Profile
            </Text>

            <TouchableOpacity
              onPress={save}
              disabled={!isValid || isSaving}
              style={[
                styles.saveBtn,
                A11yStandards.minTouchTarget,
                { opacity: isValid && !isSaving ? 1 : 0.5 },
              ]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Save profile changes"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={BrandColors.cyan} />
              ) : (
                <Text style={[styles.saveText, { color: BrandColors.cyan, fontSize: typography.fontSize.sm }]}>
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <Avatar
                name={form.displayName || profile.displayName}
                source={form.avatarUri}
                size="xl"
              />
              <TouchableOpacity
                onPress={handleChangePhoto}
                style={[styles.changePhotoBtn, A11yStandards.minTouchTarget]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Change profile picture"
              >
                <Ionicons name="camera-outline" size={16} color={BrandColors.cyan} />
                <Text style={[styles.changePhotoText, { color: BrandColors.cyan, fontSize: typography.fontSize.sm }]}>
                  Change Photo
                </Text>
              </TouchableOpacity>
              {photoNotice && (
                <Text style={[styles.photoNotice, { color: BrandColors.cyan, fontSize: typography.fontSize.xs }]}>
                  {photoNotice}
                </Text>
              )}
            </View>

            {/* Error Message if Save Failed */}
            {saveError && (
              <View style={[styles.errorBanner, { backgroundColor: 'rgba(254, 44, 85, 0.1)', borderColor: BrandColors.pink }]}>
                <Ionicons name="alert-circle" size={16} color={BrandColors.pink} />
                <Text style={[styles.errorText, { color: BrandColors.pink }]}>{saveError}</Text>
              </View>
            )}

            {/* 1. Display Name Input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>DISPLAY NAME</Text>
                <Text style={[styles.charCount, { color: theme.textMuted }]}>
                  {form.displayName.length} / 50
                </Text>
              </View>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: theme.text,
                    backgroundColor: theme.card,
                    borderColor: errors.displayName ? BrandColors.pink : theme.border,
                  },
                ]}
                placeholder="Enter your name"
                placeholderTextColor={theme.textMuted}
                value={form.displayName}
                onChangeText={(val) => setField('displayName', val)}
                maxLength={50}
                accessible={true}
                accessibilityLabel="Display name input"
              />
              {errors.displayName && (
                <Text style={[styles.fieldError, { color: BrandColors.pink }]}>
                  {errors.displayName}
                </Text>
              )}
            </View>

            {/* 2. Username Input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>USERNAME</Text>
                <Text style={[styles.charCount, { color: theme.textMuted }]}>
                  {form.username.length} / 30
                </Text>
              </View>
              <View
                style={[
                  styles.usernameRow,
                  {
                    backgroundColor: theme.card,
                    borderColor: errors.username ? BrandColors.pink : theme.border,
                  },
                ]}
              >
                <Text style={[styles.usernamePrefix, { color: theme.textSecondary }]}>@</Text>
                <TextInput
                  style={[styles.usernameInput, { color: theme.text }]}
                  placeholder="username"
                  placeholderTextColor={theme.textMuted}
                  value={form.username}
                  onChangeText={(val) => setField('username', val.toLowerCase())}
                  maxLength={30}
                  autoCapitalize="none"
                  accessible={true}
                  accessibilityLabel="Username input"
                />
              </View>
              {errors.username && (
                <Text style={[styles.fieldError, { color: BrandColors.pink }]}>
                  {errors.username}
                </Text>
              )}
            </View>

            {/* 3. Bio Input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>BIO</Text>
                <Text style={[styles.charCount, { color: theme.textMuted }]}>
                  {form.bio.length} / 150
                </Text>
              </View>
              <TextInput
                style={[
                  styles.bioInput,
                  {
                    color: theme.text,
                    backgroundColor: theme.card,
                    borderColor: errors.bio ? BrandColors.pink : theme.border,
                  },
                ]}
                placeholder="Tell your audience about yourself..."
                placeholderTextColor={theme.textMuted}
                value={form.bio}
                onChangeText={(val) => setField('bio', val)}
                multiline={true}
                numberOfLines={3}
                maxLength={150}
                accessible={true}
                accessibilityLabel="Bio description input"
              />
              {errors.bio && (
                <Text style={[styles.fieldError, { color: BrandColors.pink }]}>{errors.bio}</Text>
              )}
            </View>

            {/* 4. Website Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>WEBSITE</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: theme.text,
                    backgroundColor: theme.card,
                    borderColor: errors.website ? BrandColors.pink : theme.border,
                  },
                ]}
                placeholder="https://yourwebsite.com"
                placeholderTextColor={theme.textMuted}
                value={form.website}
                onChangeText={(val) => setField('website', val)}
                keyboardType="url"
                autoCapitalize="none"
                accessible={true}
                accessibilityLabel="Website URL input"
              />
              {errors.website && (
                <Text style={[styles.fieldError, { color: BrandColors.pink }]}>
                  {errors.website}
                </Text>
              )}
            </View>
          </ScrollView>

          {/* Discard Confirmation Overlay */}
          {showDiscardAlert && (
            <View style={styles.discardAlertOverlay}>
              <View style={[styles.alertCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.alertTitle, { color: theme.text }]}>Discard Changes?</Text>
                <Text style={[styles.alertMessage, { color: theme.textSecondary }]}>
                  You have unsaved changes in your profile. Are you sure you want to discard them?
                </Text>
                <View style={styles.alertActionsRow}>
                  <TouchableOpacity
                    onPress={() => setShowDiscardAlert(false)}
                    style={[styles.alertBtn, A11yStandards.minTouchTarget, { backgroundColor: theme.card }]}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Keep editing profile"
                  >
                    <Text style={[styles.alertBtnText, { color: theme.text }]}>Keep Editing</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirmDiscard}
                    style={[styles.alertBtn, A11yStandards.minTouchTarget, { backgroundColor: BrandColors.pink }]}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Discard profile changes"
                  >
                    <Text style={[styles.alertBtnText, { color: '#FFFFFF' }]}>Discard</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    maxHeight: '90%',
    paddingBottom: 24,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  cancelText: {
    fontWeight: '600',
  },
  title: {
    fontWeight: '700',
  },
  saveBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 8,
  },
  saveText: {
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: 16,
  },
  bodyContent: {
    paddingVertical: 16,
    gap: 20,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 44,
  },
  changePhotoText: {
    fontWeight: '600',
  },
  photoNotice: {
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  charCount: {
    fontSize: 11,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 44,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  usernamePrefix: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 4,
  },
  usernameInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
  },
  bioInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  fieldError: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  discardAlertOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 100,
  },
  alertCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  alertActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  alertBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 44,
  },
  alertBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
