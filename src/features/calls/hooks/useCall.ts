/**
 * TikTalk Hook: useCall
 * Consumer hook providing clean calling utilities, formatted call timer,
 * caller information, and action dispatchers.
 */

import { useMemo } from 'react';
import { useCallContext } from '../context/CallContext';

export const useCall = () => {
  const context = useCallContext();
  const { activeCall, incomingCall } = context;

  const formattedDuration = useMemo(() => {
    if (!activeCall) return '00:00';
    const totalSec = activeCall.durationSeconds || 0;
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [activeCall?.durationSeconds]);

  const callTitle = useMemo(() => {
    if (!activeCall) return '';
    if (activeCall.isGroup) {
      return activeCall.groupTitle || 'Group Call';
    }
    const other = activeCall.participants.find((p) => p.userId !== 'me');
    return other?.user?.displayName || other?.user?.username || 'Voice Call';
  }, [activeCall]);

  const incomingCallerName = useMemo(() => {
    if (!incomingCall) return '';
    if (incomingCall.isGroup) {
      return incomingCall.groupTitle || 'Incoming Group Call';
    }
    return incomingCall.initiator?.displayName || incomingCall.initiator?.username || 'Incoming Call';
  }, [incomingCall]);

  return {
    ...context,
    formattedDuration,
    callTitle,
    incomingCallerName,
    isInCall: !!activeCall,
    isConnected: activeCall?.status === 'connected',
    isRinging: activeCall?.status === 'ringing',
    isAudioOnly: activeCall?.type === 'audio',
    isVideo: activeCall?.type === 'video',
  };
};
