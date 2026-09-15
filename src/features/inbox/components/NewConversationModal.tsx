import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface NewConversationModalProps {
  visible: boolean;
  onClose: () => void;
  onStartDirect: (participantId: string) => Promise<void>;
  onStartGroup: (title: string, participantIds: string[]) => Promise<void>;
}

export const NewConversationModal: React.FC<NewConversationModalProps> = ({
  visible,
  onClose,
  onStartDirect,
  onStartGroup,
}) => {
  const { theme, typography } = useTheme();
  const [activeTab, setActiveTab] = useState<'direct' | 'group'>('direct');
  const [directUsername, setDirectUsername] = useState<string>('');
  const [groupTitle, setGroupTitle] = useState<string>('');
  const [groupParticipants, setGroupParticipants] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setDirectUsername('');
    setGroupTitle('');
    setGroupParticipants('');
    setErrorMessage(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleStartDirect = async () => {
    const cleaned = directUsername.trim().replace(/^@/, '');
    if (!cleaned) {
      setErrorMessage('Please enter a username or user ID.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await onStartDirect(cleaned);
      handleClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to start direct conversation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartGroup = async () => {
    const cleanedTitle = groupTitle.trim();
    if (!cleanedTitle) {
      setErrorMessage('Please enter a group name.');
      return;
    }
    const participants = groupParticipants
      .split(',')
      .map((p) => p.trim().replace(/^@/, ''))
      .filter((p) => p.length > 0);

    if (participants.length === 0) {
      setErrorMessage('Please add at least one participant.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    try {
      await onStartGroup(cleanedTitle, participants);
      handleClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create group.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              {/* Modal Header */}
              <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <Text
                  style={[
                    styles.title,
                    { color: theme.text, fontSize: typography.fontSize.lg },
                  ]}
                >
                  New Message
                </Text>
                <TouchableOpacity
                  style={[styles.closeBtn, A11yStandards.minTouchTarget]}
                  onPress={handleClose}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Close new message dialog"
                >
                  <Ionicons name="close" size={22} color={theme.text} />
                </TouchableOpacity>
              </View>

              {/* Mode Switcher */}
              <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
                <TouchableOpacity
                  style={[
                    styles.tabItem,
                    A11yStandards.minTouchTarget,
                    activeTab === 'direct' && [
                      styles.tabItemActive,
                      { borderBottomColor: BrandColors.cyan },
                    ],
                  ]}
                  onPress={() => {
                    setActiveTab('direct');
                    setErrorMessage(null);
                  }}
                  accessible={true}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activeTab === 'direct' }}
                  accessibilityLabel="Direct Message"
                >
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={activeTab === 'direct' ? BrandColors.cyan : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color:
                          activeTab === 'direct' ? BrandColors.cyan : theme.textSecondary,
                        fontSize: typography.fontSize.sm,
                      },
                    ]}
                  >
                    Direct Message
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabItem,
                    A11yStandards.minTouchTarget,
                    activeTab === 'group' && [
                      styles.tabItemActive,
                      { borderBottomColor: BrandColors.cyan },
                    ],
                  ]}
                  onPress={() => {
                    setActiveTab('group');
                    setErrorMessage(null);
                  }}
                  accessible={true}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activeTab === 'group' }}
                  accessibilityLabel="New Group"
                >
                  <Ionicons
                    name="people-outline"
                    size={16}
                    color={activeTab === 'group' ? BrandColors.cyan : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color:
                          activeTab === 'group' ? BrandColors.cyan : theme.textSecondary,
                        fontSize: typography.fontSize.sm,
                      },
                    ]}
                  >
                    New Group
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Form Content */}
              <View style={styles.formContainer}>
                {errorMessage && (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={16} color={BrandColors.pink} />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                {activeTab === 'direct' ? (
                  <View style={styles.inputGroup}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: theme.textSecondary, fontSize: typography.fontSize.xs },
                      ]}
                    >
                      Recipient Username or User ID
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.background,
                          color: theme.text,
                          borderColor: theme.border,
                        },
                      ]}
                      value={directUsername}
                      onChangeText={setDirectUsername}
                      placeholder="e.g. alex_creator"
                      placeholderTextColor={theme.textSecondary}
                      autoCapitalize="none"
                      autoCorrect={false}
                      accessible={true}
                      accessibilityLabel="Recipient username or user ID"
                    />
                  </View>
                ) : (
                  <View style={styles.inputGroup}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: theme.textSecondary, fontSize: typography.fontSize.xs },
                      ]}
                    >
                      Group Name
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.background,
                          color: theme.text,
                          borderColor: theme.border,
                        },
                      ]}
                      value={groupTitle}
                      onChangeText={setGroupTitle}
                      placeholder="e.g. Design Collab"
                      placeholderTextColor={theme.textSecondary}
                      autoCapitalize="words"
                      accessible={true}
                      accessibilityLabel="Group name"
                    />

                    <Text
                      style={[
                        styles.inputLabel,
                        {
                          color: theme.textSecondary,
                          fontSize: typography.fontSize.xs,
                          marginTop: 12,
                        },
                      ]}
                    >
                      Participants (comma-separated usernames)
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.background,
                          color: theme.text,
                          borderColor: theme.border,
                        },
                      ]}
                      value={groupParticipants}
                      onChangeText={setGroupParticipants}
                      placeholder="e.g. maria, john, chen"
                      placeholderTextColor={theme.textSecondary}
                      autoCapitalize="none"
                      autoCorrect={false}
                      accessible={true}
                      accessibilityLabel="Group participants, comma separated"
                    />
                  </View>
                )}

                {/* Submit Action */}
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    A11yStandards.minTouchTarget,
                    {
                      backgroundColor: BrandColors.cyan,
                      opacity: isLoading ? 0.7 : 1,
                    },
                  ]}
                  onPress={activeTab === 'direct' ? handleStartDirect : handleStartGroup}
                  disabled={isLoading}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={activeTab === 'direct' ? 'Start Direct Chat' : 'Create Group Chat'}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={BrandColors.black} />
                  ) : (
                    <Text style={styles.submitBtnText}>
                      {activeTab === 'direct' ? 'Start Chat' : 'Create Group'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontWeight: '800',
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    // borderBottomColor set dynamically
  },
  tabText: {
    fontWeight: '600',
  },
  formContainer: {
    padding: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(254, 44, 85, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  errorText: {
    color: BrandColors.pink,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  submitBtn: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  submitBtnText: {
    color: BrandColors.black,
    fontWeight: '800',
    fontSize: 15,
  },
});
