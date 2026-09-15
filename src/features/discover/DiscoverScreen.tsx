import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { Header } from '../../components/ui/Header';
import { useNavigation } from '../../navigation';
import { useSearch } from './hooks/useSearch';
import {
  SearchBar,
  SearchCategoryTabs,
  SearchHistoryView,
  DiscoverContentGrid,
  DiscoverStateView,
} from './components';
import {
  CreatorSearchResult,
  VideoSearchResult,
  HashtagSearchResult,
  AudioSearchResult,
} from './types';

export const DiscoverScreen: React.FC = () => {
  const { theme } = useTheme();
  const { openStories } = useNavigation();

  // Phase 3 Search State Hook
  const search = useSearch('all');

  const hasResults =
    search.status === 'success' &&
    (search.results.creators.length > 0 ||
      search.results.videos.length > 0 ||
      search.results.hashtags.length > 0 ||
      search.results.audio.length > 0);

  const showHistory =
    search.query.trim().length === 0 && search.history.length > 0;

  const showCategoryTabs =
    search.query.trim().length > 0 || hasResults;

  const handleSelectCreator = (creator: CreatorSearchResult) => {
    openStories({
      userId: creator.username,
      entryPoint: 'home_rail',
    });
  };

  const handleSelectVideo = (_video: VideoSearchResult) => {
    // Navigation to video feed boundary
  };

  const handleSelectHashtag = (hashtag: HashtagSearchResult) => {
    search.setQuery(hashtag.tag);
    search.submitSearch(hashtag.tag);
  };

  const handleSelectAudio = (audio: AudioSearchResult) => {
    search.setQuery(audio.title);
    search.submitSearch(audio.title);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <Header
        activeFeed="forYou"
        onFeedChange={() => {}}
        showTabs={false}
        title="Discover & Search"
      />

      {/* Search Input Bar */}
      <SearchBar
        query={search.query}
        onChangeQuery={search.setQuery}
        onSubmit={() => search.submitSearch()}
        onClear={search.clearSearch}
      />

      {/* Category Tabs (All, People, Videos, Hashtags, Audio) */}
      {showCategoryTabs && (
        <SearchCategoryTabs
          activeCategory={search.activeCategory}
          onSelectCategory={search.setActiveCategory}
        />
      )}

      {/* Main Content Area */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search History Chips (When query is empty and history exists) */}
        {showHistory && (
          <SearchHistoryView
            history={search.history}
            onSelectQuery={(q) => {
              search.setQuery(q);
              search.submitSearch(q);
            }}
            onRemoveItem={search.removeHistoryItem}
            onClearAll={search.clearHistory}
          />
        )}

        {/* Results Grid / Categorized Results */}
        {hasResults ? (
          <DiscoverContentGrid
            results={search.results}
            activeCategory={search.activeCategory}
            onSelectCreator={handleSelectCreator}
            onToggleFollowCreator={search.toggleFollowCreator}
            onSelectVideo={handleSelectVideo}
            onSelectHashtag={handleSelectHashtag}
            onSelectAudio={handleSelectAudio}
          />
        ) : (
          <DiscoverStateView
            status={search.status}
            query={search.query}
            category={search.activeCategory}
            errorMessage={search.errorMessage}
            onRetry={search.refresh}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
});
