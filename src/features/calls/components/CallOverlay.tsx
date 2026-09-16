/**
 * TikTalk Component: CallOverlay
 * Global root-level overlay managing IncomingCallBanner, ActiveCallModal,
 * and FloatingCallPiP according to current call state and minimize status.
 */

import React from 'react';
import { useCall } from '../hooks/useCall';
import { ActiveCallModal } from './ActiveCallModal';
import { IncomingCallBanner } from './IncomingCallBanner';
import { FloatingCallPiP } from './FloatingCallPiP';

export const CallOverlay: React.FC = () => {
  const {
    activeCall,
    incomingCall,
    deviceState,
    isPiP,
    formattedDuration,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
    setAudioRoute,
    toggleScreenShare,
    setPiP,
  } = useCall();

  return (
    <>
      {/* 1. Incoming Call Banner */}
      {incomingCall && !activeCall && (
        <IncomingCallBanner
          incomingCall={incomingCall}
          onAccept={(callId) => acceptCall(callId)}
          onDecline={(callId) => rejectCall(callId)}
        />
      )}

      {/* 2. Active Call Modal (Full-Screen / Dialog) */}
      {activeCall && !isPiP && (
        <ActiveCallModal
          call={activeCall}
          deviceState={deviceState}
          durationFormatted={formattedDuration}
          onMinimize={() => setPiP(true)}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onSwitchCamera={switchCamera}
          onToggleAudioRoute={() => {
            const nextRoute = deviceState.audioRoute === 'speaker' ? 'earpiece' : 'speaker';
            setAudioRoute(nextRoute);
          }}
          onToggleScreenShare={toggleScreenShare}
          onEndCall={() => endCall(activeCall.id)}
        />
      )}

      {/* 3. Floating Picture-in-Picture */}
      {activeCall && isPiP && (
        <FloatingCallPiP
          call={activeCall}
          deviceState={deviceState}
          durationFormatted={formattedDuration}
          onMaximize={() => setPiP(false)}
          onToggleMute={toggleMute}
          onEndCall={() => endCall(activeCall.id)}
        />
      )}
    </>
  );
};
