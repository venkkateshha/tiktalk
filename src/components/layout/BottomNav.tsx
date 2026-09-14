import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../theme';
import { BrandColors } from '../../theme/colors';
import { NavigationTab } from '../../types';
import { Ionicons } from '@expo/vector-icons';

interface BottomNavProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { theme, typography } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.navBackground,
          borderTopColor: theme.navBorder,
        },
      ]}
    >
      {/* 1. Home */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabChange('Home')}
        activeOpacity={0.7}
      >
        <Ionicons
          name={activeTab === 'Home' ? 'home' : 'home-outline'}
          size={22}
          color={activeTab === 'Home' ? theme.text : theme.textSecondary}
        />
        <Text
          style={[
            styles.tabLabel,
            {
              color: activeTab === 'Home' ? theme.text : theme.textSecondary,
              fontSize: typography.fontSize.xs,
              fontWeight: activeTab === 'Home' ? '700' : '500',
            },
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* 2. Discover */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabChange('Discover')}
        activeOpacity={0.7}
      >
        <Ionicons
          name={activeTab === 'Discover' ? 'compass' : 'compass-outline'}
          size={22}
          color={activeTab === 'Discover' ? theme.text : theme.textSecondary}
        />
        <Text
          style={[
            styles.tabLabel,
            {
              color: activeTab === 'Discover' ? theme.text : theme.textSecondary,
              fontSize: typography.fontSize.xs,
              fontWeight: activeTab === 'Discover' ? '700' : '500',
            },
          ]}
        >
          Discover
        </Text>
      </TouchableOpacity>

      {/* 3. Create ("+" Center Button) */}
      <TouchableOpacity
        style={styles.createButtonContainer}
        onPress={() => onTabChange('Create')}
        activeOpacity={0.8}
      >
        <View style={styles.createButtonBorderCyan} />
        <View style={styles.createButtonBorderPink} />
        <View style={[styles.createButtonInner, { backgroundColor: theme.text }]}>
          <Ionicons name="add" size={24} color={theme.background} />
        </View>
      </TouchableOpacity>

      {/* 4. Inbox */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabChange('Inbox')}
        activeOpacity={0.7}
      >
        <Ionicons
          name={activeTab === 'Inbox' ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
          size={22}
          color={activeTab === 'Inbox' ? theme.text : theme.textSecondary}
        />
        <Text
          style={[
            styles.tabLabel,
            {
              color: activeTab === 'Inbox' ? theme.text : theme.textSecondary,
              fontSize: typography.fontSize.xs,
              fontWeight: activeTab === 'Inbox' ? '700' : '500',
            },
          ]}
        >
          Inbox
        </Text>
      </TouchableOpacity>

      {/* 5. Profile */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabChange('Profile')}
        activeOpacity={0.7}
      >
        <Ionicons
          name={activeTab === 'Profile' ? 'person' : 'person-outline'}
          size={22}
          color={activeTab === 'Profile' ? theme.text : theme.textSecondary}
        />
        <Text
          style={[
            styles.tabLabel,
            {
              color: activeTab === 'Profile' ? theme.text : theme.textSecondary,
              fontSize: typography.fontSize.xs,
              fontWeight: activeTab === 'Profile' ? '700' : '500',
            },
          ]}
        >
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: Platform.OS === 'ios' ? 82 : 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 0.5,
    paddingBottom: Platform.OS === 'ios' ? 20 : 6,
    paddingTop: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    marginTop: 3,
    letterSpacing: 0.1,
  },
  createButtonContainer: {
    width: 46,
    height: 32,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  createButtonBorderCyan: {
    position: 'absolute',
    left: 0,
    width: 40,
    height: 30,
    backgroundColor: BrandColors.cyan,
    borderRadius: 8,
  },
  createButtonBorderPink: {
    position: 'absolute',
    right: 0,
    width: 40,
    height: 30,
    backgroundColor: BrandColors.pink,
    borderRadius: 8,
  },
  createButtonInner: {
    width: 38,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});
