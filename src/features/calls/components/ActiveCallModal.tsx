/**
 * TikTalk Component: ActiveCallModal
 * Full-screen (Mobile) or Centered Modal (Desktop Web) for active voice and video calls.
 * Displays participant streams, call timers, audio visualizers, and controls.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  useWindowDimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CallSession, MediaDeviceState } from '../../../domain/call';
import { BrandColors } from '../../../theme/colors';
import { A11yStandards } from '../../../core/a11y/a11yStandards';
import { VideoGrid } from './VideoGrid';
import { CallControlsBar } from './CallControlsBar';

export interface ActiveCallModalProps {
  call: CallSession;
  deviceState: MediaDeviceState;
  durationFormatted: string;
  onMinimize: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onSwitchCamera: () => void;
  onToggleAudioRoute: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
}

export const ActiveCallModal: React.FC<ActiveCallModalProps> = ({
  call,
  deviceState,
  durationFormatted,
  onMinimize,
  onToggleMute,
  onToggleVideo,
  onSwitchCamera,
  onToggleAudioRoute,
  onToggleScreenShare,
  onEndCall,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const other = call.participants.find((p) => p.userId !== 'me');
  const title = call.isGroup
    ? call.groupTitle || 'Group Call'
    : other?.user?.displayName || other?.user?.username || 'Call';

  const isRinging = call.status === 'ringing' || call.status === 'initiating';
  const statusText = isRinging ? 'Calling...' : durationFormatted;

  return (
    <Modal
      visible={true}
      animationType="fade"
      transparent={isDesktop}
      statusBarTranslucent
    >
      <View style={[styles.backdrop, isDesktop && styles.desktopBackdrop]}>
        <SafeAreaView style={[styles.modalCard, isDesktop && styles.desktopCard]}>
          {/* 1. Header Bar */}
          <View style={styles.headerBar}>
            <TouchableOpacity
              style={[styles.headerBtn, A11yStandards.minTouchTarget]}
              onPress={onMinimize}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Minimize call"
            >
              <Ionicons name="chevron-down" size={24} color={BrandColors.white} />
            </TouchableOpacity>

            <View style={styles.headerTitleCol}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.headerStatus}>{statusText}</Text>
            </View>

            <View style={styles.headerBadge}>
              <Text style={styles.badgeText}>
                {call.type === 'video' ? 'HD VIDEO' : 'VOICE'}
              </Text>
            </View>
          </View>

          {/* 2. Video Grid / Participant Stage */}
          <View style={styles.stageContainer}>
            <VideoGrid
              participants={call.participants}
              localDeviceState={deviceState}
              isAudioOnly={call.type === 'audio'}
            />
          </View>

          {/* 3. Floating In-Call Controls Bar */}
          <View style={styles.controlsWrap}>
            <CallControlsBar
              callType={call.type}
              deviceState={deviceState}
              onToggleMute={onToggleMute}
              onToggleVideo={onToggleVideo}
              onSwitchCamera={onSwitchCamera}
              onToggleAudioRoute={onToggleAudioRoute}
              onToggleScreenShare={onToggleScreenShare}
              onMinimize={onMinimize}
              onEndCall={onEndCall}
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: BrandColors.black,
  },
  desktopBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: BrandColors.black,
    position: 'relative',
  },
  desktopCard: {
    maxWidth: 820,
    maxHeight: 640,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 24,
  },
  headerBar: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 16 : 40,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    color: BrandColors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  headerStatus: {
    color: BrandColors.cyan,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  headerBadge: {
    backgroundColor: 'rgba(37, 244, 238, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BrandColors.cyan,
  },
  badgeText: {
    color: BrandColors.cyan,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  stageContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  controlsWrap: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 24 : 36,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
  },
});
