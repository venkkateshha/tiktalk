import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { BrandColors } from '../../theme/colors';
import { Header } from '../../components/ui/Header';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Ionicons } from '@expo/vector-icons';

export const ProfileScreen: React.FC = () => {
  const { theme, typography } = useTheme();
  const [activeTab, setActiveTab] = useState<'videos' | 'liked' | 'saved'>('videos');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header activeFeed="forYou" onFeedChange={() => {}} showTabs={false} title="Creator Profile" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatar, { backgroundColor: theme.surface, borderColor: BrandColors.cyan }]}>
              <Ionicons name="person" size={40} color={theme.text} />
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-sharp" size={10} color={BrandColors.white} />
            </View>
          </View>

          <Text style={[styles.displayName, { color: theme.text, fontSize: typography.fontSize.lg }]}>
            TikTalk Creator
          </Text>
          <Text style={[styles.handle, { color: theme.textSecondary, fontSize: typography.fontSize.sm }]}>
            @tiktalk.official
          </Text>
        </View>

        {/* Stats Row */}
        <View style={[styles.statsRow, { borderColor: theme.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text, fontSize: typography.fontSize.md }]}>0</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]}>Following</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text, fontSize: typography.fontSize.md }]}>0</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text, fontSize: typography.fontSize.md }]}>0</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]}>Likes</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Button label="Edit Profile" variant="outline" size="sm" style={{ flex: 1 }} onPress={() => {}} />
          <View style={{ width: 8 }} />
          <Button label="Share Profile" variant="outline" size="sm" style={{ flex: 1 }} onPress={() => {}} />
        </View>

        {/* 60% Creator Economy & Weekly Monday UPI Payout Card */}
        <View style={[styles.walletCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.walletHeader}>
            <View style={styles.walletTitleRow}>
              <Ionicons name="wallet-outline" size={18} color={BrandColors.cyan} />
              <Text style={[styles.walletTitle, { color: theme.text, fontSize: typography.fontSize.sm }]}>
                Creator Wallet & Payouts
              </Text>
            </View>
            <Badge label="60% REV-SHARE" variant="accent" />
          </View>

          <View style={styles.walletMetrics}>
            <View>
              <Text style={[styles.balanceLabel, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]}>
                Available Balance
              </Text>
              <Text style={[styles.balanceValue, { color: theme.text, fontSize: typography.fontSize.xl }]}>
                ₹0.00
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.balanceLabel, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]}>
                Next Automated Payout
              </Text>
              <Text style={[styles.payoutSchedule, { color: BrandColors.cyan, fontSize: typography.fontSize.xs }]}>
                Monday 10:00 AM IST
              </Text>
            </View>
          </View>

          <View style={[styles.walletFooter, { borderTopColor: theme.border }]}>
            <Ionicons name="card-outline" size={14} color={BrandColors.pink} />
            <Text style={[styles.upiText, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]}>
              Automated Direct UPI Transfer • Minimum threshold ₹500
            </Text>
          </View>
        </View>

        {/* Profile Tabs */}
        <View style={[styles.profileTabs, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.profileTab, activeTab === 'videos' && { borderBottomColor: BrandColors.cyan, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab('videos')}
          >
            <Ionicons name="grid-outline" size={20} color={activeTab === 'videos' ? theme.text : theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.profileTab, activeTab === 'liked' && { borderBottomColor: BrandColors.pink, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab('liked')}
          >
            <Ionicons name="heart-outline" size={20} color={activeTab === 'liked' ? theme.text : theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.profileTab, activeTab === 'saved' && { borderBottomColor: BrandColors.cyan, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab('saved')}
          >
            <Ionicons name="bookmark-outline" size={20} color={activeTab === 'saved' ? theme.text : theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Tab Content Empty State */}
        <EmptyState
          title="No Published Videos Yet"
          badgeText="Creator Studio"
          description="Create and post your first video using our built-in camera studio to begin earning 60% qualified revenue."
          iconName="videocam-outline"
        />
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BrandColors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BrandColors.black,
  },
  displayName: {
    fontWeight: '800',
    marginBottom: 2,
  },
  handle: {
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(128,128,128,0.2)',
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  walletCard: {
    marginHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletTitle: {
    fontWeight: '700',
    marginLeft: 8,
  },
  walletMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  balanceLabel: {
    marginBottom: 2,
  },
  balanceValue: {
    fontWeight: '800',
  },
  payoutSchedule: {
    fontWeight: '700',
  },
  walletFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 0.5,
  },
  upiText: {
    marginLeft: 6,
    fontWeight: '500',
  },
  profileTabs: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    marginBottom: 16,
  },
  profileTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
});
