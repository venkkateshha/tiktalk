/**
 * TikTalk Component: VideoGrid
 * Renders video tiles for 1:1 and group calls.
 * Displays speaking indicators (Cyan glow #25F4EE), mute status,
 * local video thumbnail PiP, and participant avatars.
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CallParticipant, MediaDeviceState } from '../../../domain/call';
import { BrandColors } from '../../../theme/colors';
import { Avatar } from '../../../components/ui/Avatar';
import { AudioWaveformVisualizer } from './AudioWaveformVisualizer';

export interface VideoGridProps {
  participants: CallParticipant[];
  localDeviceState: MediaDeviceState;
  isAudioOnly?: boolean;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  participants,
  localDeviceState,
  isAudioOnly = false,
}) => {
  const remoteParticipants = participants.filter((p) => p.userId !== 'me');
  const isOneOnOne = remoteParticipants.length <= 1;
  const mainParticipant = remoteParticipants[0] || participants[0];

  if (isOneOnOne) {
    return (
      <View style={styles.container}>
        {/* Main Remote View */}
        <View style={styles.mainTile}>
          <View style={styles.avatarCentered}>
            <Avatar
              source={mainParticipant?.user?.avatarUrl}
              name={mainParticipant?.user?.displayName || mainParticipant?.user?.username || 'User'}
              size="xl"
              isVerified={mainParticipant?.user?.verificationStatus === 'verified'}
            />
            <Text style={styles.participantName}>
              {mainParticipant?.user?.displayName || mainParticipant?.user?.username || 'Participant'}
            </Text>

            {/* Speaking / Audio visualizer */}
            <View style={styles.waveformWrap}>
              <AudioWaveformVisualizer
                isSpeaking={mainParticipant?.isSpeaking ?? true}
                isMuted={mainParticipant?.audioMuted ?? false}
                size="md"
              />
            </View>
          </View>

          {/* Remote Status Badges */}
          {mainParticipant?.audioMuted && (
            <View style={styles.mutedBadge}>
              <Ionicons name="mic-off" size={14} color={BrandColors.white} />
              <Text style={styles.badgeText}>Muted</Text>
            </View>
          )}
        </View>

        {/* Local Preview Tile (PiP in corner for Video Calls) */}
        {!isAudioOnly && (
          <View style={styles.localPipTile}>
            {localDeviceState.videoOff ? (
              <View style={styles.localCamOff}>
                <Ionicons name="videocam-off" size={20} color={BrandColors.white} />
                <Text style={styles.localPipLabel}>Camera Off</Text>
              </View>
            ) : (
              <View style={styles.localVideoActive}>
                <Avatar
                  name="You"
                  size="sm"
                />
                <Text style={styles.localPipLabel}>You</Text>
              </View>
            )}
            {localDeviceState.audioMuted && (
              <View style={styles.localMuteDot}>
                <Ionicons name="mic-off" size={12} color={BrandColors.pink} />
              </View>
            )}
          </View>
        )}
      </View>
    );
  }

  // Group Grid Mode
  return (
    <View style={styles.groupGridContainer}>
      {participants.map((p) => {
        const isMe = p.userId === 'me';
        const isMuted = isMe ? localDeviceState.audioMuted : p.audioMuted;
        const isSpeaking = p.isSpeaking;

        return (
          <View
            key={p.userId}
            style={[
              styles.groupTile,
              isSpeaking && styles.groupTileSpeaking,
            ]}
          >
            <Avatar
              source={p.user?.avatarUrl}
              name={p.user?.displayName || p.user?.username || (isMe ? 'You' : 'User')}
              size="md"
            />
            <Text style={styles.groupTileName} numberOfLines={1}>
              {isMe ? 'You' : p.user?.displayName || p.user?.username || 'User'}
            </Text>

            {isMuted && (
              <View style={styles.groupMuteBadge}>
                <Ionicons name="mic-off" size={12} color={BrandColors.pink} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: BrandColors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainTile: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCentered: {
    alignItems: 'center',
    gap: 16,
  },
  participantName: {
    color: BrandColors.white,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
  },
  waveformWrap: {
    marginTop: 12,
  },
  mutedBadge: {
    position: 'absolute',
    top: 24,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(254, 44, 85, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 6,
  },
  badgeText: {
    color: BrandColors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  localPipTile: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 100,
    height: 140,
    borderRadius: 12,
    backgroundColor: '#1C1C1E',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  localCamOff: {
    alignItems: 'center',
    gap: 6,
  },
  localVideoActive: {
    alignItems: 'center',
    gap: 6,
  },
  localPipLabel: {
    color: BrandColors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  localMuteDot: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    padding: 3,
  },
  groupGridContainer: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.black,
  },
  groupTile: {
    width: '47%',
    height: '47%',
    minHeight: 140,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    position: 'relative',
  },
  groupTileSpeaking: {
    borderColor: BrandColors.cyan,
  },
  groupTileName: {
    color: BrandColors.white,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  groupMuteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    padding: 4,
  },
});
