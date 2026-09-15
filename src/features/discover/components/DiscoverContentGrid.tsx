import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../../../theme';
import { BrandColors } from '../../../theme/colors';
import {
  SearchCategory,
  UnifiedSearchResults,
  CreatorSearchResult,
  VideoSearchResult,
  HashtagSearchResult,
  AudioSearchResult,
} from '../types';
import { CreatorResultCard } from './CreatorResultCard';
import { VideoGridCard } from './VideoGridCard';
import { HashtagResultCard } from './HashtagResultCard';
import { AudioResultCard } from './AudioResultCard';

export interface DiscoverContentGridProps {
  results: UnifiedSearchResults;
  activeCategory: SearchCategory;
  onSelectCreator?: (creator: CreatorSearchResult) => void;
  onToggleFollowCreator?: (creator: CreatorSearchResult) => void;
  onSelectVideo?: (video: VideoSearchResult) => void;
  onSelectHashtag?: (hashtag: HashtagSearchResult) => void;
  onSelectAudio?: (audio: AudioSearchResult) => void;
}

export const DiscoverContentGrid: React.FC<DiscoverContentGridProps> = ({
  results,
  activeCategory,
  onSelectCreator,
  onToggleFollowCreator,
  onSelectVideo,
  onSelectHashtag,
  onSelectAudio,
}) => {
  const { theme, typography } = useTheme();
  const { width } = useWindowDimensions();

  // Compute number of columns for video grid: 2 on mobile, 3 on tablet, 4 on desktop
  const numColumns = width < 640 ? 2 : width < 1024 ? 3 : 4;

  const renderVideosGrid = (videos: VideoSearchResult[]) => {
    // Chunk videos into rows according to numColumns
    const rows: VideoSearchResult[][] = [];
    for (let i = 0; i < videos.length; i += numColumns) {
      rows.push(videos.slice(i, i + numColumns));
    }

    return (
      <View style={styles.gridContainer}>
        {rows.map((row, rowIndex) => (
          <View key={`row_${rowIndex}`} style={styles.gridRow}>
            {row.map((video) => (
              <VideoGridCard
                key={video.id}
                video={video}
                onSelectVideo={onSelectVideo}
              />
            ))}
            {/* Fill empty spaces in last row if not full */}
            {row.length < numColumns &&
              Array.from({ length: numColumns - row.length }).map((_, idx) => (
                <View key={`filler_${idx}`} style={styles.fillerCell} />
              ))}
          </View>
        ))}
      </View>
    );
  };

  if (activeCategory === 'people') {
    return (
      <View style={styles.section}>
        {results.creators.map((creator) => (
          <CreatorResultCard
            key={creator.id}
            creator={creator}
            onSelectCreator={onSelectCreator}
            onToggleFollow={onToggleFollowCreator}
          />
        ))}
      </View>
    );
  }

  if (activeCategory === 'videos') {
    return <View style={styles.section}>{renderVideosGrid(results.videos)}</View>;
  }

  if (activeCategory === 'hashtags') {
    return (
      <View style={styles.section}>
        {results.hashtags.map((hashtag) => (
          <HashtagResultCard
            key={hashtag.id}
            hashtag={hashtag}
            onSelectHashtag={onSelectHashtag}
          />
        ))}
      </View>
    );
  }

  if (activeCategory === 'audio') {
    return (
      <View style={styles.section}>
        {results.audio.map((audio) => (
          <AudioResultCard
            key={audio.id}
            audio={audio}
            onSelectAudio={onSelectAudio}
          />
        ))}
      </View>
    );
  }

  // Unified 'all' category view
  return (
    <View style={styles.section}>
      {/* 1. Creators Section */}
      {results.creators.length > 0 && (
        <View style={styles.subSection}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text, fontSize: typography.fontSize.md },
            ]}
          >
            Creators
          </Text>
          {results.creators.slice(0, 3).map((creator) => (
            <CreatorResultCard
              key={creator.id}
              creator={creator}
              onSelectCreator={onSelectCreator}
              onToggleFollow={onToggleFollowCreator}
            />
          ))}
        </View>
      )}

      {/* 2. Videos Section */}
      {results.videos.length > 0 && (
        <View style={styles.subSection}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text, fontSize: typography.fontSize.md },
            ]}
          >
            Videos
          </Text>
          {renderVideosGrid(results.videos)}
        </View>
      )}

      {/* 3. Hashtags Section */}
      {results.hashtags.length > 0 && (
        <View style={styles.subSection}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text, fontSize: typography.fontSize.md },
            ]}
          >
            Hashtags
          </Text>
          {results.hashtags.map((hashtag) => (
            <HashtagResultCard
              key={hashtag.id}
              hashtag={hashtag}
              onSelectHashtag={onSelectHashtag}
            />
          ))}
        </View>
      )}

      {/* 4. Audio Section */}
      {results.audio.length > 0 && (
        <View style={styles.subSection}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text, fontSize: typography.fontSize.md },
            ]}
          >
            Sounds
          </Text>
          {results.audio.map((audio) => (
            <AudioResultCard
              key={audio.id}
              audio={audio}
              onSelectAudio={onSelectAudio}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
  },
  subSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: '800',
    marginBottom: 10,
    marginLeft: 4,
    letterSpacing: 0.2,
  },
  gridContainer: {
    width: '100%',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 4,
  },
  fillerCell: {
    flex: 1,
    margin: 4,
  },
});
