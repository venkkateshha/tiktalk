import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import { Badge } from '../../../components/ui/Badge';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface CreatorEconomicsCardProps {
  onOpenStudio?: () => void;
  onOpenWallet?: () => void;
}

export const CreatorEconomicsCard: React.FC<CreatorEconomicsCardProps> = ({
  onOpenStudio,
  onOpenWallet,
}) => {
  const { theme, typography } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel="Creator economics and weekly Monday payouts card"
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Ionicons name="sparkles" size={18} color={BrandColors.cyan} />
          <Text style={[styles.title, { color: theme.text, fontSize: typography.fontSize.sm }]}>
            Creator Studio & Monetization
          </Text>
        </View>
        <Badge label="60% REV-SHARE" variant="accent" />
      </View>

      {/* Description */}
      <Text style={[styles.description, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]}>
        Automated weekly Monday payouts via UPI/bank transfer. Earn directly from your 60 FPS vertical video views.
      </Text>

      {/* Action Row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          onPress={onOpenWallet}
          style={[
            styles.actionChip,
            A11yStandards.minTouchTarget,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Open creator wallet"
        >
          <Ionicons name="wallet-outline" size={16} color={BrandColors.cyan} />
          <Text style={[styles.chipText, { color: theme.text }]}>Creator Wallet</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenStudio}
          style={[
            styles.actionChip,
            A11yStandards.minTouchTarget,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Open creator analytics"
        >
          <Ionicons name="bar-chart-outline" size={16} color={BrandColors.pink} />
          <Text style={[styles.chipText, { color: theme.text }]}>Analytics</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontWeight: '700',
  },
  description: {
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    minHeight: 44,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
