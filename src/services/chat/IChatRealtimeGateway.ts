/**
 * TikTalk Service Boundary: Chat Realtime Gateway Contract
 * Typed interface boundary for future WebSocket / server-sent event connections.
 * HONEST ARCHITECTURE: Defined as a contract boundary ready for live production backends.
 * Does NOT pretend WebSocket is live if no external server is connected.
 */

import { Message, PresenceStatus, UserPresence, TypingIndicator } from '../../domain/chat';

export type RealtimeConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'simulated';

export type ChatRealtimeListener = (event: {
  type:
    | 'message_received'
    | 'message_delivered'
    | 'message_read'
    | 'typing'
    | 'presence';
  conversationId: string;
  data?: unknown;
}) => void;

export interface IChatRealtimeGateway {
  /**
   * Current connection status
   */
  getConnectionState(): RealtimeConnectionState;

  /**
   * Establish connection boundary
   */
  connect(): Promise<void>;

  /**
   * Close connection
   */
  disconnect(): Promise<void>;

  /**
   * Subscribe to incoming events for a specific conversation
   */
  subscribeToConversation(
    conversationId: string,
    listener: ChatRealtimeListener
  ): () => void;

  /**
   * Broadcast local typing indicator event to peers
   */
  sendTyping(conversationId: string, isTyping: boolean): void;

  /**
   * Broadcast local presence status
   */
  sendPresence(status: PresenceStatus): void;
}

export class ChatRealtimeGateway implements IChatRealtimeGateway {
  private state: RealtimeConnectionState = 'disconnected';
  private listeners: Map<string, Set<ChatRealtimeListener>> = new Map();

  getConnectionState(): RealtimeConnectionState {
    return this.state;
  }

  async connect(): Promise<void> {
    // Contract boundary ready for live WebSocket connection
    this.state = 'simulated';
  }

  async disconnect(): Promise<void> {
    this.state = 'disconnected';
    this.listeners.clear();
  }

  subscribeToConversation(
    conversationId: string,
    listener: ChatRealtimeListener
  ): () => void {
    if (!this.listeners.has(conversationId)) {
      this.listeners.set(conversationId, new Set());
    }
    this.listeners.get(conversationId)!.add(listener);

    return () => {
      this.listeners.get(conversationId)?.delete(listener);
    };
  }

  sendTyping(_conversationId: string, _isTyping: boolean): void {
    // Gateway transmission boundary
  }

  sendPresence(_status: PresenceStatus): void {
    // Gateway transmission boundary
  }
}

export const chatRealtimeGateway: IChatRealtimeGateway = new ChatRealtimeGateway();
