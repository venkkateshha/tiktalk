/**
 * TikTalk Service: WebRtcPlatformFactory
 * Platform selection layer for WebRTC managers.
 * Directs Web to WebWebRtcManager, Android to NativeWebRtcManager,
 * and maintains iOS as explicitly not implemented yet.
 */

import { Platform } from 'react-native';
import { IWebRtcManager } from './IWebRtcManager';
import { webWebRtcManager } from './WebWebRtcManager';
import { nativeWebRtcManager } from './NativeWebRtcManager';

export function getWebRtcManager(): IWebRtcManager {
  if (Platform.OS === 'web') {
    return webWebRtcManager;
  }

  if (Platform.OS === 'android') {
    return nativeWebRtcManager;
  }

  if (Platform.OS === 'ios') {
    console.warn('[WebRtcPlatformFactory] iOS native WebRTC is not implemented yet');
    throw new Error('iOS native WebRTC is not implemented yet');
  }

  return webWebRtcManager;
}

export const defaultWebRtcManager: IWebRtcManager = getWebRtcManager();
