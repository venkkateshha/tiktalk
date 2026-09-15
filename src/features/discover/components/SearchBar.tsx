import React, { useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface SearchBarProps {
  query: string;
  onChangeQuery: (text: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onChangeQuery,
  onSubmit,
  onClear,
  placeholder = 'Search creators, videos, sounds, hashtags...',
  autoFocus = false,
}) => {
  const { theme, typography } = useTheme();
  const inputRef = useRef<TextInput>(null);

  const hasText = query.length > 0;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: hasText ? BrandColors.cyan : theme.border,
        },
      ]}
      accessible={true}
      accessibilityRole="search"
    >
      {/* Search Icon */}
      <Ionicons
        name="search"
        size={20}
        color={hasText ? BrandColors.cyan : theme.textSecondary}
        style={styles.searchIcon}
      />

      {/* Text Input */}
      <TextInput
        ref={inputRef}
        value={query}
        onChangeText={onChangeQuery}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        returnKeyType="search"
        autoFocus={autoFocus}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="never"
        style={[
          styles.input,
          {
            color: theme.text,
            fontSize: typography.fontSize.sm,
          },
        ]}
        accessible={true}
        accessibilityLabel="Search TikTalk"
      />

      {/* Clear Button (Visible only when text is present) */}
      {hasText && (
        <TouchableOpacity
          onPress={() => {
            onClear();
            inputRef.current?.focus();
          }}
          style={[styles.clearButton, A11yStandards.minTouchTarget]}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Clear search input"
        >
          <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      )}

      {/* Submit / Search Action Button */}
      {hasText && (
        <TouchableOpacity
          onPress={onSubmit}
          style={[styles.submitButton, A11yStandards.minTouchTarget]}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Execute search"
        >
          <Ionicons name="arrow-forward" size={18} color={BrandColors.black} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    outlineStyle: 'none' as any,
  },
  clearButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  submitButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BrandColors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});
