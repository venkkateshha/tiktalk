/**
 * TikTalk Component: FloatingCallPiP
 * Minimized Picture-in-Picture floating tile allowing users to multitask,
 * browse feeds, or navigate chats while maintaining active voice/video calls.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CallSession, MediaDeviceState } from '../../../domain/call';
import { BrandColors } from '../../../theme/colors';
import { Avatar } from '../../../components/ui/Avatar';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface FloatingCallPiPProps {
  call: CallSession;
  deviceState: MediaDeviceState;
  durationFormatted: string;
  onMaximize: () => void;
  onToggleMute: () => void;
  onEndCall: () => void;
}

export const FloatingCallPiP: React.FC<FloatingCallPiPProps> = ({
  call,
  deviceState,
  durationFormatted,
  onMaximize,
  onToggleMute,
  onEndCall,
}) => {
  const other = call.participants.find((p) => p.userId !== 'me');
  const title = call.isGroup
    ? call.groupTitle || 'Group Call'
    : other?.user?.displayName || other?.user?.username || 'Call';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.clickableArea}
        onPress={onMaximize}
        activeOpacity={0.9}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Active call with ${title}, duration ${durationFormatted}. Tap to maximize`}
      >
        <Avatar
          source={other?.user?.avatarUrl}
          name={title}
          size="sm"
          isVerified={other?.user?.verificationStatus === 'verified'}
        />
        <View style={styles.infoCol}>
          <Text style={styles.titleText} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.statusRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.durationText}>{durationFormatted}</Text>
          </View>
        </View>

        {/* Expand Icon */}
        <Ionicons name="expand-outline" size={18} color={BrandColors.white} style={styles.expandIcon} />
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Quick In-PiP Controls */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, A11yStandards.minTouchTarget]}
          onPress={onToggleMute}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={deviceState.audioMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          <Ionicons
            name={deviceState.audioMuted ? 'mic-off' : 'mic'}
            size={18}
            color={deviceState.audioMuted ? BrandColors.pink : BrandColors.white}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.endBtn, A11yStandards.minTouchTarget]}
          onPress={onEndCall}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="End call"
        >
          <Ionicons name="call" size={18} color={BrandColors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 24 : 80,
    right: 20,
    width: 260,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1.5,
    borderColor: BrandColors.cyan,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
    zIndex: 9998,
  },
  clickableArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoCol: {
    marginLeft: 10,
    flex: 1,
  },
  titleText: {
    color: BrandColors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BrandColors.cyan,
  },
  durationText: {
    color: BrandColors.cyan,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  expandIcon: {
    marginLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BrandColors.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
