/**
 * TikTalk Service Boundary: Call Realtime Signaling Gateway Contract
 * Defines the bidirectional communication boundary for WebRTC session negotiation,
 * ICE candidates, call invitations, ringing, acceptance, rejection, and teardown.
 * ZERO fake infrastructure: Clearly defines honest gateway behavior.
 */

import { SignalingMessage } from '../../domain/call';

export type SignalingConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'simulated';

export type SignalingEventListener = (message: SignalingMessage) => void;

export interface ICallSignalingGateway {
  /**
   * Current signaling gateway connection status
   */
  getConnectionState(): SignalingConnectionState;

  /**
   * Establish connection to signaling gateway
   */
  connect(): Promise<void>;

  /**
   * Disconnect from signaling gateway
   */
  disconnect(): Promise<void>;

  /**
   * Transmit a signaling message to a peer or room
   */
  sendSignalingMessage(message: SignalingMessage): Promise<void>;

  /**
   * Subscribe to incoming signaling messages for a specific call session
   */
  subscribe(callId: string, listener: SignalingEventListener): () => void;

  /**
   * Subscribe to global call invitations (incoming call rings)
   */
  subscribeToInvitations(userId: string, listener: SignalingEventListener): () => void;
}
