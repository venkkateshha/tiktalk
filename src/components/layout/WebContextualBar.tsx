import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { BrandColors } from '../../theme/colors';
import { Badge } from '../ui/Badge';
import { Ionicons } from '@expo/vector-icons';

export const WebContextualBar: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderLeftColor: theme.border }]}>
      {/* System Status Panel */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Platform Status</Text>
          <Badge label="Active" variant="primary" />
        </View>

        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Architecture</Text>
          <Text style={[styles.metricVal, { color: theme.text }]}>New Arch (Fabric)</Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Video Engine</Text>
          <Text style={[styles.metricVal, { color: theme.text }]}>Adaptive HLS</Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Storage</Text>
          <Text style={[styles.metricVal, { color: theme.text }]}>Cloudflare R2</Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Ledger</Text>
          <Text style={[styles.metricVal, { color: BrandColors.cyan }]}>Double-Entry</Text>
        </View>
      </View>

      {/* Locked Design Tokens Verification */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 10 }]}>
          Locked Brand Palette
        </Text>
        
        <View style={styles.colorRow}>
          <View style={[styles.colorChip, { backgroundColor: BrandColors.black, borderColor: theme.border }]} />
          <Text style={[styles.colorHex, { color: theme.text }]}>#000000 (Black)</Text>
        </View>

        <View style={styles.colorRow}>
          <View style={[styles.colorChip, { backgroundColor: BrandColors.white, borderColor: '#CCCCCC' }]} />
          <Text style={[styles.colorHex, { color: theme.text }]}>#FFFFFF (White)</Text>
        </View>

        <View style={styles.colorRow}>
          <View style={[styles.colorChip, { backgroundColor: BrandColors.cyan }]} />
          <Text style={[styles.colorHex, { color: theme.text }]}>#25F4EE (Cyan)</Text>
        </View>

        <View style={styles.colorRow}>
          <View style={[styles.colorChip, { backgroundColor: BrandColors.pink }]} />
          <Text style={[styles.colorHex, { color: theme.text }]}>#FE2C55 (Pink/Red)</Text>
        </View>
      </View>

      {/* Trust & Safety Notice */}
      <View style={styles.trustBox}>
        <Ionicons name="shield-checkmark-outline" size={16} color={BrandColors.cyan} />
        <Text style={[styles.trustText, { color: theme.textSecondary }]}>
          TikTalk Trust & Safety Guidelines: Strict anti-fraud, 100% human-verified creator payouts.
        </Text>
      </View>

      <Text style={[styles.footerLegal, { color: theme.textMuted }]}>
        © 2026 TikTalk Inc. All rights reserved. Phase 0 Foundation.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 280,
    borderLeftWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 20,
    height: '100%',
  },
  card: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  metricLabel: {
    fontSize: 12,
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '600',
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorChip: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: 10,
  },
  colorHex: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  trustBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    marginTop: 8,
  },
  trustText: {
    fontSize: 11,
    lineHeight: 15,
    marginLeft: 8,
    flex: 1,
  },
  footerLegal: {
    fontSize: 10,
    marginTop: 'auto',
    textAlign: 'center',
  },
});
