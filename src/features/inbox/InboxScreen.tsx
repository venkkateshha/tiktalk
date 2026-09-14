import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { BrandColors } from '../../theme/colors';
import { Header } from '../../components/ui/Header';
import { EmptyState } from '../../components/ui/EmptyState';
import { Ionicons } from '@expo/vector-icons';

export const InboxScreen: React.FC = () => {
  const { theme, typography } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header activeFeed="forYou" onFeedChange={() => {}} showTabs={false} title="Notifications & Messages" />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Quick Tabs: All Activity | Direct Messages */}
        <View style={[styles.filterBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.filterTab, { backgroundColor: theme.card }]}>
            <Text style={[styles.filterText, { color: theme.text, fontWeight: '700' }]}>All Activity</Text>
          </View>
          <View style={styles.filterTab}>
            <Text style={[styles.filterText, { color: theme.textSecondary }]}>Direct Messages</Text>
          </View>
        </View>

        <EmptyState
          title="No Notifications Yet"
          badgeText="Activity Stream Ready"
          description="When users like your videos, comment, or start a live battle, updates will appear here in real-time."
          iconName="notifications-outline"
        />

        {/* Security Notice */}
        <View style={[styles.securityCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="lock-closed-outline" size={18} color={BrandColors.cyan} />
          <Text style={[styles.securityText, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]}>
            TikTalk End-to-End messaging architecture is designed with strict tenant isolation and Vanish Mode privacy.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  filterBar: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 4,
    marginBottom: 24,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  filterText: {
    fontSize: 13,
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    maxWidth: 400,
    alignSelf: 'center',
  },
  securityText: {
    marginLeft: 10,
    flex: 1,
    lineHeight: 16,
  },
});
