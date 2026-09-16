/**
 * TikTalk Component: IncomingCallBanner
 * Heads-up overlay banner for incoming voice/video calls.
 * Complies with accessibility standards (min touch target >= 44pt),
 * locked colors (#FE2C55 Decline, #25F4EE Accept), and responsive layout.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CallSession } from '../../../domain/call';
import { BrandColors } from '../../../theme/colors';
import { Avatar } from '../../../components/ui/Avatar';
import { A11yStandards } from '../../../core/a11y/a11yStandards';

export interface IncomingCallBannerProps {
  incomingCall: CallSession;
  onAccept: (callId: string) => void;
  onDecline: (callId: string) => void;
}

export const IncomingCallBanner: React.FC<IncomingCallBannerProps> = ({
  incomingCall,
  onAccept,
  onDecline,
}) => {
  const caller = incomingCall.initiator;
  const callerName = caller?.displayName || caller?.username || 'TikTalk User';
  const isVideo = incomingCall.type === 'video';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.bannerCard}>
        {/* Caller Info */}
        <View style={styles.callerInfoRow}>
          <Avatar
            source={caller?.avatarUrl}
            name={callerName}
            size="md"
            isVerified={caller?.verificationStatus === 'verified'}
          />
          <View style={styles.callerTextCol}>
            <Text style={styles.callerName} numberOfLines={1}>
              {callerName}
            </Text>
            <View style={styles.callTypeRow}>
              <Ionicons
                name={isVideo ? 'videocam' : 'call'}
                size={14}
                color={BrandColors.cyan}
              />
              <Text style={styles.callTypeLabel}>
                Incoming {isVideo ? 'Video' : 'Voice'} Call...
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          {/* Decline Button (Locked Pink/Red #FE2C55) */}
          <TouchableOpacity
            style={[styles.declineBtn, A11yStandards.minTouchTarget]}
            onPress={() => onDecline(incomingCall.id)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Decline call from ${callerName}`}
          >
            <Ionicons name="call" size={22} color={BrandColors.white} style={styles.declineIcon} />
          </TouchableOpacity>

          {/* Accept Button (Locked Cyan #25F4EE) */}
          <TouchableOpacity
            style={[styles.acceptBtn, A11yStandards.minTouchTarget]}
            onPress={() => onAccept(incomingCall.id)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Accept call from ${callerName}`}
          >
            <Ionicons
              name={isVideo ? 'videocam' : 'call'}
              size={22}
              color={BrandColors.black}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 16 : 44,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  bannerCard: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
  },
  callerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  callerTextCol: {
    marginLeft: 12,
    flex: 1,
  },
  callerName: {
    color: BrandColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  callTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  callTypeLabel: {
    color: BrandColors.cyan,
    fontSize: 12,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  declineBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BrandColors.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineIcon: {
    transform: [{ rotate: '135deg' }],
  },
  acceptBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BrandColors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
