import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { BrandColors } from '../../theme/colors';
import { Header } from '../../components/ui/Header';
import { Badge } from '../../components/ui/Badge';
import { Ionicons } from '@expo/vector-icons';

export const DiscoverScreen: React.FC = () => {
  const { theme, typography } = useTheme();

  const trendingTopics = [
    { tag: '#TikTalkCreator', count: '100% Launch' },
    { tag: '#60PercentRevShare', count: 'Disruptive' },
    { tag: '#WeeklyUPIPayouts', count: 'Every Monday' },
    { tag: '#AdaptiveHLS', count: '60 FPS' },
    { tag: '#ZeroEgressR2', count: 'Cloudflare' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header activeFeed="forYou" onFeedChange={() => {}} showTabs={false} title="Discover & Trends" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search" size={18} color={theme.textSecondary} />
          <TextInput
            placeholder="Search creators, sounds, hashtags..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, fontSize: typography.fontSize.sm }]}
            editable={false}
          />
        </View>

        {/* Trending Banner */}
        <View style={[styles.bannerCard, { backgroundColor: BrandColors.black, borderColor: BrandColors.darkBorder }]}>
          <View style={styles.bannerBadge}>
            <Badge label="TRENDING NOW" variant="accent" />
          </View>
          <Text style={[styles.bannerTitle, { color: BrandColors.white, fontSize: typography.fontSize.lg }]}>
            TikTalk Creator Revolution 🚀
          </Text>
          <Text style={[styles.bannerDesc, { color: BrandColors.darkTextSecondary, fontSize: typography.fontSize.xs }]}>
            Join the new era of short-video entertainment with automated weekly Monday UPI payouts.
          </Text>
        </View>

        {/* Trending Hashtags Section */}
        <Text style={[styles.sectionHeading, { color: theme.text, fontSize: typography.fontSize.md }]}>
          Trending Topics
        </Text>

        <View style={styles.tagsContainer}>
          {trendingTopics.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.tagCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              activeOpacity={0.7}
            >
              <View style={styles.tagLeft}>
                <View style={[styles.hashCircle, { backgroundColor: theme.card }]}>
                  <Ionicons name="trending-up" size={16} color={BrandColors.cyan} />
                </View>
                <View style={styles.tagInfo}>
                  <Text style={[styles.tagTitle, { color: theme.text, fontSize: typography.fontSize.sm }]}>
                    {item.tag}
                  </Text>
                  <Text style={[styles.tagSubtitle, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]}>
                    Official Campaign
                  </Text>
                </View>
              </View>
              <Badge label={item.count} variant={index === 0 ? 'primary' : 'neutral'} />
            </TouchableOpacity>
          ))}
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
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    marginLeft: 10,
  },
  bannerCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  bannerBadge: {
    marginBottom: 8,
  },
  bannerTitle: {
    fontWeight: '800',
    marginBottom: 4,
  },
  bannerDesc: {
    lineHeight: 16,
  },
  sectionHeading: {
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  tagsContainer: {
    gap: 8,
    marginBottom: 32,
  },
  tagCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hashCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tagInfo: {
    justifyContent: 'center',
  },
  tagTitle: {
    fontWeight: '700',
  },
  tagSubtitle: {
    marginTop: 2,
  },
});
