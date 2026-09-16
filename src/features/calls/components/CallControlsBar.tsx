/**
 * TikTalk Component: CallControlsBar
 * Responsive in-call action controls adhering to accessibility standards (touch >= 44pt),
 * locked brand colors, audio routing, camera flipping, and Web screen sharing.
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors } from '../../../theme/colors';
import { A11yStandards } from '../../../core/a11y/a11yStandards';
import { MediaDeviceState, CallType } from '../../../domain/call';

export interface CallControlsBarProps {
  callType: CallType;
  deviceState: MediaDeviceState;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onSwitchCamera: () => void;
  onToggleAudioRoute: () => void;
  onToggleScreenShare: () => void;
  onMinimize: () => void;
  onEndCall: () => void;
}

export const CallControlsBar: React.FC<CallControlsBarProps> = ({
  callType,
  deviceState,
  onToggleMute,
  onToggleVideo,
  onSwitchCamera,
  onToggleAudioRoute,
  onToggleScreenShare,
  onMinimize,
  onEndCall,
}) => {
  const isWeb = Platform.OS === 'web';
  const isAudioOnly = callType === 'audio';

  return (
    <View style={styles.container}>
      {/* 1. Mute Microphone */}
      <TouchableOpacity
        style={[
          styles.actionBtn,
          A11yStandards.minTouchTarget,
          deviceState.audioMuted && styles.actionBtnActive,
        ]}
        onPress={onToggleMute}
        accessible={true}
        accessibilityRole="button"
        accessibilityState={{ selected: deviceState.audioMuted }}
        accessibilityLabel={deviceState.audioMuted ? 'Unmute microphone' : 'Mute microphone'}
      >
        <Ionicons
          name={deviceState.audioMuted ? 'mic-off' : 'mic'}
          size={24}
          color={deviceState.audioMuted ? BrandColors.pink : BrandColors.white}
        />
        <Text style={styles.btnLabel}>{deviceState.audioMuted ? 'Muted' : 'Mute'}</Text>
      </TouchableOpacity>

      {/* 2. Video Toggle */}
      {!isAudioOnly && (
        <TouchableOpacity
          style={[
            styles.actionBtn,
            A11yStandards.minTouchTarget,
            deviceState.videoOff && styles.actionBtnActive,
          ]}
          onPress={onToggleVideo}
          accessible={true}
          accessibilityRole="button"
          accessibilityState={{ selected: !deviceState.videoOff }}
          accessibilityLabel={deviceState.videoOff ? 'Turn video on' : 'Turn video off'}
        >
          <Ionicons
            name={deviceState.videoOff ? 'videocam-off' : 'videocam'}
            size={24}
            color={deviceState.videoOff ? BrandColors.pink : BrandColors.white}
          />
          <Text style={styles.btnLabel}>{deviceState.videoOff ? 'Cam Off' : 'Video'}</Text>
        </TouchableOpacity>
      )}

      {/* 3. Camera Flip (When video is active) */}
      {!isAudioOnly && !deviceState.videoOff && (
        <TouchableOpacity
          style={[styles.actionBtn, A11yStandards.minTouchTarget]}
          onPress={onSwitchCamera}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Flip camera direction"
        >
          <Ionicons name="camera-reverse-outline" size={24} color={BrandColors.white} />
          <Text style={styles.btnLabel}>Flip</Text>
        </TouchableOpacity>
      )}

      {/* 4. Audio Route Toggle (Speaker / Earpiece / Bluetooth) */}
      <TouchableOpacity
        style={[styles.actionBtn, A11yStandards.minTouchTarget]}
        onPress={onToggleAudioRoute}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Audio route: ${deviceState.audioRoute}`}
      >
        <Ionicons
          name={deviceState.audioRoute === 'speaker' ? 'volume-high' : 'headset'}
          size={24}
          color={deviceState.audioRoute === 'speaker' ? BrandColors.cyan : BrandColors.white}
        />
        <Text style={styles.btnLabel}>
          {deviceState.audioRoute === 'speaker' ? 'Speaker' : 'Headset'}
        </Text>
      </TouchableOpacity>

      {/* 5. Screen Share (Desktop Web only) */}
      {isWeb && (
        <TouchableOpacity
          style={[
            styles.actionBtn,
            A11yStandards.minTouchTarget,
            deviceState.screenSharing && styles.actionBtnActiveCyan,
          ]}
          onPress={onToggleScreenShare}
          accessible={true}
          accessibilityRole="button"
          accessibilityState={{ selected: deviceState.screenSharing }}
          accessibilityLabel={deviceState.screenSharing ? 'Stop screen sharing' : 'Share screen'}
        >
          <Ionicons
            name="desktop-outline"
            size={24}
            color={deviceState.screenSharing ? BrandColors.cyan : BrandColors.white}
          />
          <Text style={styles.btnLabel}>{deviceState.screenSharing ? 'Sharing' : 'Share'}</Text>
        </TouchableOpacity>
      )}

      {/* 6. Minimize to PiP */}
      <TouchableOpacity
        style={[styles.actionBtn, A11yStandards.minTouchTarget]}
        onPress={onMinimize}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Minimize call to picture in picture"
      >
        <Ionicons name="contract-outline" size={24} color={BrandColors.white} />
        <Text style={styles.btnLabel}>Minimize</Text>
      </TouchableOpacity>

      {/* 7. Hang Up / End Call (Locked Pink/Red #FE2C55) */}
      <TouchableOpacity
        style={[styles.endCallBtn, A11yStandards.minTouchTarget]}
        onPress={onEndCall}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="End call"
      >
        <Ionicons name="call" size={26} color={BrandColors.white} />
        <Text style={styles.endBtnLabel}>End</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 24,
    gap: 12,
    alignSelf: 'center',
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  actionBtnActive: {
    backgroundColor: 'rgba(254, 44, 85, 0.25)',
    borderWidth: 1,
    borderColor: BrandColors.pink,
  },
  actionBtnActiveCyan: {
    backgroundColor: 'rgba(37, 244, 238, 0.25)',
    borderWidth: 1,
    borderColor: BrandColors.cyan,
  },
  endCallBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BrandColors.pink,
  },
  btnLabel: {
    color: BrandColors.white,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  endBtnLabel: {
    color: BrandColors.white,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
});
