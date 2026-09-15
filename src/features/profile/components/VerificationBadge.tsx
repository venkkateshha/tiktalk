import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VerificationBadgeStatus } from '../types';
import { BrandColors } from '../../../theme/colors';

export interface VerificationBadgeProps {
  status: VerificationBadgeStatus;
  size?: number;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  status,
  size = 16,
}) => {
  if (status === 'none' || status === 'rejected') {
    return null;
  }

  const isVerified = status === 'verified';

  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isVerified ? BrandColors.cyan : BrandColors.darkBorder,
        },
      ]}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={isVerified ? 'Verified account badge' : 'Verification pending review'}
    >
      <Ionicons
        name={isVerified ? 'checkmark-sharp' : 'time-outline'}
        size={Math.round(size * 0.7)}
        color={isVerified ? '#000000' : BrandColors.cyan}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
