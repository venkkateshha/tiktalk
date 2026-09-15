import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { SearchHistoryItem } from '../types';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface SearchHistoryViewProps {
  history: SearchHistoryItem[];
  onSelectQuery: (query: string) => void;
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
}

export const SearchHistoryView: React.FC<SearchHistoryViewProps> = ({
  history,
  onSelectQuery,
  onRemoveItem,
  onClearAll,
}) => {
  const { theme, typography } = useTheme();

  if (!history || history.length === 0) {
    return null;
  }

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel="Recent searches"
    >
      {/* Header with Title and Clear All */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text, fontSize: typography.fontSize.sm },
            ]}
          >
            Recent Searches
          </Text>
        </View>

        <TouchableOpacity
          onPress={onClearAll}
          style={[styles.clearAllBtn, A11yStandards.minTouchTarget]}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Clear all recent searches"
        >
          <Text
            style={[
              styles.clearAllText,
              { color: BrandColors.pink, fontSize: typography.fontSize.xs },
            ]}
          >
            Clear All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chips Container */}
      <View style={styles.chipsWrap}>
        {history.map((item) => (
          <View
            key={item.id}
            style={[
              styles.chipContainer,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            {/* Query Select Area */}
            <TouchableOpacity
              onPress={() => onSelectQuery(item.query)}
              style={styles.chipTextTouch}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Search for ${item.query}`}
            >
              <Text
                style={[
                  styles.chipLabel,
                  { color: theme.text, fontSize: typography.fontSize.xs },
                ]}
                numberOfLines={1}
              >
                {item.query}
              </Text>
            </TouchableOpacity>

            {/* Individual Remove Button */}
            <TouchableOpacity
              onPress={() => onRemoveItem(item.id)}
              style={[styles.chipRemoveTouch, A11yStandards.minTouchTarget]}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item.query} from history`}
            >
              <Ionicons name="close" size={14} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  clearAllBtn: {
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearAllText: {
    fontWeight: '700',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingLeft: 12,
    paddingRight: 4,
    height: 36,
  },
  chipTextTouch: {
    maxWidth: 160,
    justifyContent: 'center',
  },
  chipLabel: {
    fontWeight: '600',
  },
  chipRemoveTouch: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
