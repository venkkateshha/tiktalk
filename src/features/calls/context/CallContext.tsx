/**
 * TikTalk Feature: CallContext
 * Root-level Call State Provider managing active and incoming call sessions,
 * media device states, PiP overlay transitions, and Web keyboard hotkeys.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import {
  CallSession,
  CallType,
  CallEndReason,
  AudioDeviceRoute,
  CameraFacing,
  MediaDeviceState,
} from '../../../domain/call';
import { callService, callCoordinator } from '../../../services/calls';

export interface CallContextValue {
  activeCall: CallSession | null;
  incomingCall: CallSession | null;
  deviceState: MediaDeviceState;
  isPiP: boolean;
  startCall: (conversationId: string, type: CallType, recipientId?: string) => Promise<CallSession>;
  acceptCall: (callId: string) => Promise<CallSession>;
  rejectCall: (callId: string, reason?: CallEndReason) => Promise<void>;
  endCall: (callId: string, reason?: CallEndReason) => Promise<void>;
  toggleMute: () => Promise<boolean>;
  toggleVideo: () => Promise<boolean>;
  switchCamera: () => Promise<CameraFacing>;
  setAudioRoute: (route: AudioDeviceRoute) => Promise<AudioDeviceRoute>;
  toggleScreenShare: () => Promise<boolean>;
  setPiP: (pip: boolean) => void;
}

const CallContext = createContext<CallContextValue | null>(null);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [deviceState, setDeviceState] = useState<MediaDeviceState>(callService.getMediaDeviceState());
  const [isPiP, setIsPiP] = useState<boolean>(false);

  // Synchronize state with CallCoordinator events
  useEffect(() => {
    const unsubEvents = callCoordinator.subscribe((event) => {
      switch (event.type) {
        case 'call_started':
        case 'call_ringing':
        case 'call_connected':
        case 'participant_updated':
          if (event.call) {
            setActiveCall({ ...event.call });
          }
          break;
        case 'call_ended':
          setActiveCall(null);
          setIncomingCall(null);
          setIsPiP(false);
          break;
        case 'device_state_changed':
          if (event.deviceState) {
            setDeviceState({ ...event.deviceState });
          }
          if (event.call) {
            setActiveCall({ ...event.call });
          }
          break;
      }
    });

    const unsubIncoming = callCoordinator.subscribeToIncoming((call) => {
      setIncomingCall({ ...call });
    });

    return () => {
      unsubEvents();
      unsubIncoming();
    };
  }, []);

  const handleStartCall = useCallback(
    async (conversationId: string, type: CallType, recipientId?: string) => {
      const session = await callService.startCall(conversationId, type, recipientId);
      setActiveCall({ ...session });
      setIsPiP(false);
      return session;
    },
    []
  );

  const handleAcceptCall = useCallback(async (callId: string) => {
    const session = await callService.acceptCall(callId);
    setActiveCall({ ...session });
    setIncomingCall(null);
    setIsPiP(false);
    return session;
  }, []);

  const handleRejectCall = useCallback(async (callId: string, reason?: CallEndReason) => {
    await callService.rejectCall(callId, reason);
    setIncomingCall(null);
  }, []);

  const handleEndCall = useCallback(async (callId: string, reason?: CallEndReason) => {
    await callService.endCall(callId, reason);
    setActiveCall(null);
    setIsPiP(false);
  }, []);

  const handleToggleMute = useCallback(async () => {
    const muted = await callService.toggleMute();
    setDeviceState(callService.getMediaDeviceState());
    return muted;
  }, []);

  const handleToggleVideo = useCallback(async () => {
    const videoOff = await callService.toggleVideo();
    setDeviceState(callService.getMediaDeviceState());
    return videoOff;
  }, []);

  const handleSwitchCamera = useCallback(async () => {
    const facing = await callService.switchCamera();
    setDeviceState(callService.getMediaDeviceState());
    return facing;
  }, []);

  const handleSetAudioRoute = useCallback(async (route: AudioDeviceRoute) => {
    const nextRoute = await callService.setAudioRoute(route);
    setDeviceState(callService.getMediaDeviceState());
    return nextRoute;
  }, []);

  const handleToggleScreenShare = useCallback(async () => {
    const sharing = await callService.toggleScreenShare();
    setDeviceState(callService.getMediaDeviceState());
    return sharing;
  }, []);

  // Web desktop keyboard shortcuts: M (mute), V (video), Esc (minimize/end)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (!activeCall || activeCall.status !== 'connected') return;

      if (e.key === 'm' || e.key === 'M') {
        handleToggleMute();
      } else if (e.key === 'v' || e.key === 'V') {
        handleToggleVideo();
      } else if (e.key === 'Escape') {
        setIsPiP((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeCall, handleToggleMute, handleToggleVideo]);

  const value = useMemo<CallContextValue>(
    () => ({
      activeCall,
      incomingCall,
      deviceState,
      isPiP,
      startCall: handleStartCall,
      acceptCall: handleAcceptCall,
      rejectCall: handleRejectCall,
      endCall: handleEndCall,
      toggleMute: handleToggleMute,
      toggleVideo: handleToggleVideo,
      switchCamera: handleSwitchCamera,
      setAudioRoute: handleSetAudioRoute,
      toggleScreenShare: handleToggleScreenShare,
      setPiP: setIsPiP,
    }),
    [
      activeCall,
      incomingCall,
      deviceState,
      isPiP,
      handleStartCall,
      handleAcceptCall,
      handleRejectCall,
      handleEndCall,
      handleToggleMute,
      handleToggleVideo,
      handleSwitchCamera,
      handleSetAudioRoute,
      handleToggleScreenShare,
    ]
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export const useCallContext = (): CallContextValue => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCallContext must be used within a CallProvider');
  }
  return context;
};
