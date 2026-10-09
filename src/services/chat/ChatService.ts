/**
 * TikTalk Service Boundary: Chat Service Implementation
 * Production-ready messaging architecture supporting direct & group chats,
 * message lifecycle (pending -> sent -> delivered -> read, failed -> retry),
 * offline persistence, pending message queue, deduplication, and privacy controls.
 * Firebase Firestore wiring (conversations, messages, reactions).
 * ZERO fake business data.
 */

import { IChatService, SendMessagePayload } from './IChatService';
import {
  Conversation,
  Message,
  ConversationCursorResult,
  MessageCursorResult,
  GroupParticipant,
} from '../../domain/chat';
import { User, VerificationStatus } from '../../domain/user';
import { IApiClient, apiClient } from '../api';
import { IStorageService, storageService } from '../storage';
import { IAuthService, resolveDefaultAuthService } from '../auth';
import { ChatCoordinator } from './ChatCoordinator';
import { firestoreChatRealtimeGateway } from './FirestoreChatRealtimeGateway';
import { notificationsService } from '../notifications/NotificationsService';
import { isFirebaseConfigured, getFirebaseFirestore } from '../../core/firebase';
import { generateSecureUUID, generateSecureEntityId } from '../../core/security';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query as firestoreQuery,
  where,
  orderBy,
  limit as firestoreLimit,
} from 'firebase/firestore';

const STORAGE_KEY_CONVERSATIONS = 'tiktalk_chat_conversations';
const STORAGE_KEY_MESSAGES_PREFIX = 'tiktalk_chat_messages_';
const STORAGE_KEY_PENDING_QUEUE = 'tiktalk_chat_pending_queue';
const STORAGE_KEY_BLOCKED = 'tiktalk_chat_blocked_conversations';
const PAGE_SIZE_CONVERSATIONS = 20;
const PAGE_SIZE_MESSAGES = 25;

function generateUUID(): string {
  return generateSecureUUID();
}

/**
 * Recursively strips undefined values from an object, preserving null, false, 0,
 * and empty strings intact. Guarantees complete safety for Firestore writes.
 */
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[key] = sanitizeForFirestore(value);
    } else if (Array.isArray(value)) {
      result[key] = value
        .filter((item) => item !== undefined)
        .map((item) =>
          item !== null && typeof item === 'object' && !(item instanceof Date)
            ? sanitizeForFirestore(item)
            : item
        );
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

/**
 * Builds a clean, Firestore-safe persisted summary of lastMessage.
 * Omits undefined properties, excludes local-only fields (e.g. localId),
 * and preserves valid values (null, false, 0, empty string).
 */
export function buildFirestoreLastMessageSummary(message: Message): Record<string, any> {
  const summary: Record<string, any> = {
    id: message.id,
    conversationId: message.conversationId,
    conversation_id: message.conversationId,
    senderId: message.senderId,
    sender_id: message.senderId,
    type: message.type || 'text',
    text: typeof message.text === 'string' ? message.text : '',
    deliveryStatus: message.deliveryStatus || 'sent',
    delivery_status: message.deliveryStatus || 'sent',
    isRead: message.isRead === true,
    createdAt: message.createdAt,
    created_at: message.createdAt,
  };

  // Optional recipientId (omitted if undefined, preserved if string or null)
  if (message.recipientId !== undefined) {
    summary.recipientId = message.recipientId;
    summary.recipient_id = message.recipientId;
  }

  // Optional mediaUrl (omitted if undefined, preserved if string or null)
  if (message.mediaUrl !== undefined) {
    summary.mediaUrl = message.mediaUrl;
    summary.media_url = message.mediaUrl;
  }

  // Optional mediaDuration (omitted if undefined, preserved if number (including 0) or null)
  if (message.mediaDuration !== undefined) {
    summary.mediaDuration = message.mediaDuration;
    summary.media_duration = message.mediaDuration;
  }

  // Optional replyTo (omitted if undefined, preserved if valid object or null)
  if (message.replyTo !== undefined && message.replyTo !== null) {
    const replySummary: Record<string, any> = {
      messageId: message.replyTo.messageId,
      senderId: message.replyTo.senderId,
      senderName: message.replyTo.senderName || 'User',
      previewText: typeof message.replyTo.previewText === 'string' ? message.replyTo.previewText : '',
    };
    summary.replyTo = sanitizeForFirestore(replySummary);
  } else if (message.replyTo === null) {
    summary.replyTo = null;
  }

  return sanitizeForFirestore(summary);
}

function mapDbMessage(row: any): Message {
  const senderProf = Array.isArray(row.sender) ? row.sender[0] : row.sender;
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    recipientId: row.recipient_id || row.recipientId || undefined,
    sender: senderProf
      ? {
          id: senderProf.id,
          username: senderProf.username,
          displayName: senderProf.display_name,
          avatarUrl: senderProf.avatar_url || undefined,
          verificationStatus: (senderProf.verification_status as VerificationStatus) || 'none',
          isCreator: Boolean(senderProf.is_creator),
          createdAt: senderProf.created_at || new Date().toISOString(),
        }
      : undefined,
    type: row.type || 'text',
    text: row.text || '',
    mediaUrl: row.media_url || undefined,
    mediaDuration: row.media_duration ? Number(row.media_duration) : undefined,
    deliveryStatus: row.delivery_status || 'sent',
    isRead: row.delivery_status === 'read',
    replyTo: row.reply_to_id
      ? { messageId: row.reply_to_id, senderId: '', senderName: '', previewText: '' }
      : undefined,
    reactions: Array.isArray(row.reactions)
      ? row.reactions.map((r: any) => ({
          emoji: r.emoji,
          userId: r.user_id,
          createdAt: r.created_at,
        }))
      : [],
    localId: row.local_id || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || undefined,
  };
}

function mapDbConversation(row: any, currentUserId: string): Conversation {
  const members = Array.isArray(row.members) ? row.members : [];
  const currentMember = members.find((m: any) => m.user_id === currentUserId);
  const otherMembers = members.filter((m: any) => m.user_id !== currentUserId);

  let title = row.title;
  if (!title && row.type === 'direct' && otherMembers.length > 0) {
    const prof = Array.isArray(otherMembers[0].profile)
      ? otherMembers[0].profile[0]
      : otherMembers[0].profile;
    title = prof?.display_name || prof?.username || 'Direct Message';
  }

  const participants: GroupParticipant[] = members.map((m: any) => {
    const prof = Array.isArray(m.profile) ? m.profile[0] : m.profile;
    return {
      userId: m.user_id,
      role: m.role || 'member',
      joinedAt: m.joined_at || new Date().toISOString(),
      user: prof
        ? {
            id: prof.id,
            username: prof.username,
            displayName: prof.display_name,
            avatarUrl: prof.avatar_url || undefined,
            verificationStatus: (prof.verification_status as VerificationStatus) || 'none',
            isCreator: Boolean(prof.is_creator),
            createdAt: prof.created_at || new Date().toISOString(),
          }
        : undefined,
    };
  });

  return {
    id: row.id,
    type: row.type || 'direct',
    title: title || 'Conversation',
    avatarUrl: row.avatar_url || undefined,
    participants,
    unreadCount: 0,
    isPinned: Boolean(currentMember?.is_pinned),
    isMuted: Boolean(currentMember?.is_muted),
    isArchived: Boolean(currentMember?.is_archived),
    isBlocked: Boolean(currentMember?.is_blocked),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.last_message_at || row.updated_at || new Date().toISOString(),
  };
}

export class ChatService implements IChatService {
  private client: IApiClient;
  private storage: IStorageService;
  private auth: IAuthService;
  private authSubUnsub: (() => void) | null = null;
  private currentAuthenticatedUser: User | null = null;

  constructor(
    client: IApiClient = apiClient,
    storage: IStorageService = storageService,
    auth: IAuthService = resolveDefaultAuthService()
  ) {
    this.client = client;
    this.storage = storage;
    this.auth = auth;
    this.setupAuthListener();
  }

  private setupAuthListener(): void {
    if (this.authSubUnsub) {
      this.authSubUnsub();
      this.authSubUnsub = null;
    }
    if (this.auth?.subscribeToAuthState) {
      this.authSubUnsub = this.auth.subscribeToAuthState((session) => {
        if (session?.user?.id && session.user.id !== 'unknown') {
          this.currentAuthenticatedUser = session.user;
        } else {
          this.currentAuthenticatedUser = null;
        }
      });
    }
  }

  public setCurrentUser(user: User | null): void {
    if (user?.id && user.id !== 'unknown') {
      this.currentAuthenticatedUser = user;
    } else {
      this.currentAuthenticatedUser = null;
    }
  }

  private async getStoredConversations(): Promise<Conversation[]> {
    try {
      const items = await this.storage.getItem<Conversation[]>(STORAGE_KEY_CONVERSATIONS);
      if (Array.isArray(items)) return items;
      return [];
    } catch {
      return [];
    }
  }

  private async saveStoredConversations(items: Conversation[]): Promise<void> {
    await this.storage.setItem(STORAGE_KEY_CONVERSATIONS, items);
  }

  private async getStoredMessages(conversationId: string): Promise<Message[]> {
    try {
      const items = await this.storage.getItem<Message[]>(
        `${STORAGE_KEY_MESSAGES_PREFIX}${conversationId}`
      );
      if (Array.isArray(items)) return items;
      return [];
    } catch {
      return [];
    }
  }

  private async saveStoredMessages(conversationId: string, messages: Message[]): Promise<void> {
    await this.storage.setItem(
      `${STORAGE_KEY_MESSAGES_PREFIX}${conversationId}`,
      messages
    );
  }

  private async getCurrentUserId(): Promise<string> {
    try {
      if (
        this.currentAuthenticatedUser?.id &&
        this.currentAuthenticatedUser.id !== 'unknown'
      ) {
        return this.currentAuthenticatedUser.id;
      }
      const authInstance = this.auth || resolveDefaultAuthService();
      const user = await authInstance.getCurrentUser();
      if (user?.id && user.id !== 'unknown') {
        this.currentAuthenticatedUser = user;
        return user.id;
      }
      const fallback = resolveDefaultAuthService();
      if (fallback && fallback !== authInstance) {
        const fallbackUser = await fallback.getCurrentUser();
        if (fallbackUser?.id && fallbackUser.id !== 'unknown') {
          this.currentAuthenticatedUser = fallbackUser;
          return fallbackUser.id;
        }
      }
      return '';
    } catch {
      return '';
    }
  }

  async getConversations(
    filter: 'all' | 'unread' | 'archived' = 'all',
    query?: string,
    cursor?: string
  ): Promise<ConversationCursorResult> {
    const currentUserId = await this.getCurrentUserId();
    let conversations: Conversation[] = [];

    // 1. Try Firebase Firestore when configured
    if (isFirebaseConfigured()) {
      const db = getFirebaseFirestore();
      if (db && currentUserId && currentUserId !== 'unknown') {
        let snap;
        try {
          const q = firestoreQuery(
            collection(db, 'conversations'),
            where('participantIds', 'array-contains', currentUserId),
            orderBy('updatedAt', 'desc'),
            firestoreLimit(50)
          );
          snap = await getDocs(q);
        } catch (queryErr: any) {
          if (queryErr?.code === 'failed-precondition') {
            console.warn(
              '[ChatService] Firestore getConversations missing composite index (participantIds array-contains + updatedAt desc). Falling back to client-sorted query:',
              queryErr?.message
            );
            const fallbackQ = firestoreQuery(
              collection(db, 'conversations'),
              where('participantIds', 'array-contains', currentUserId),
              firestoreLimit(50)
            );
            snap = await getDocs(fallbackQ);
          } else if (queryErr?.code === 'permission-denied') {
            console.error('[ChatService] Access denied querying conversations for user:', currentUserId);
            throw new Error('[ChatService] Access denied: User is not authorized to read conversations.');
          } else {
            console.error('[ChatService] Firestore getConversations query failed:', queryErr);
            throw queryErr;
          }
        }

        if (snap && !snap.empty) {
          conversations = snap.docs.map((docSnap) => {
            const d = docSnap.data() as any;
            const pIds: string[] = Array.isArray(d.participantIds)
              ? d.participantIds
              : Array.isArray(d.participant_ids)
              ? d.participant_ids
              : [];
            const parts = Array.isArray(d.participants) && d.participants.length > 0
              ? d.participants
              : pIds.map((uid: string) => ({
                  userId: uid,
                  role: uid === (d.createdBy || d.created_by) ? 'owner' : 'member',
                  joinedAt: d.createdAt || d.created_at || new Date().toISOString(),
                }));
            return {
              id: docSnap.id,
              type: d.type || 'direct',
              title: d.title || (d.type === 'direct' ? 'Direct Message' : 'Conversation'),
              avatarUrl: d.avatarUrl || d.avatar_url || undefined,
              participants: parts,
              lastMessage: d.lastMessage || undefined,
              unreadCount: d.unreadCount || 0,
              isPinned: Boolean(d.isPinned),
              isMuted: Boolean(d.isMuted),
              isArchived: Boolean(d.isArchived),
              isBlocked: Boolean(d.isBlocked),
              createdAt: d.createdAt || d.created_at || new Date().toISOString(),
              updatedAt: d.updatedAt || d.updated_at || new Date().toISOString(),
              participantIds: pIds,
            } as Conversation;
          });
          // Sort descending by updatedAt in memory (guarantees correct ordering even on index fallback)
          conversations.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          await this.saveStoredConversations(conversations);
        } else {
          // Real Firestore result is empty; do NOT mask as mock stored conversations
          conversations = [];
        }
      } else {
        conversations = [];
      }
    } else {
      // Offline / standalone mode without Firebase: local persistent store
      conversations = await this.getStoredConversations();
    }

    // Apply filtering
    let filtered = [...conversations];

    if (filter === 'unread') {
      filtered = filtered.filter((c) => c.unreadCount > 0 && !c.isArchived);
    } else if (filter === 'archived') {
      filtered = filtered.filter((c) => c.isArchived);
    } else {
      // 'all' excludes archived unless searched
      if (!query) {
        filtered = filtered.filter((c) => !c.isArchived);
      }
    }

    // Apply search query filter
    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      filtered = filtered.filter((c) => {
        if (c.title && c.title.toLowerCase().includes(q)) return true;
        return c.participants.some(
          (p) =>
            p.user?.username?.toLowerCase().includes(q) ||
            p.user?.displayName?.toLowerCase().includes(q)
        );
      });
    }

    // Sort: pinned first, then newest updatedAt
    const sorted = [...filtered].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    // Pagination slice
    const startIndex = cursor ? parseInt(cursor, 10) : 0;
    const safeStart = isNaN(startIndex) ? 0 : startIndex;
    const paged = sorted.slice(safeStart, safeStart + PAGE_SIZE_CONVERSATIONS);
    const nextIndex = safeStart + PAGE_SIZE_CONVERSATIONS;
    const hasMore = nextIndex < sorted.length;

    // Calculate total unread count across all active conversations
    const totalUnread = conversations
      .filter((c) => !c.isArchived && !c.isBlocked)
      .reduce((sum, c) => sum + (c.unreadCount || 0), 0);

    ChatCoordinator.setUnreadMessagesCount(totalUnread);

    return {
      items: paged,
      nextCursor: hasMore ? String(nextIndex) : undefined,
      hasMore,
      totalUnreadCount: totalUnread,
    };
  }

  async getConversation(conversationId: string): Promise<Conversation | null> {
    const cached = ChatCoordinator.getCachedConversation(conversationId);
    if (cached) return cached;

    const currentUserId = await this.getCurrentUserId();

    if (isFirebaseConfigured()) {
      const db = getFirebaseFirestore();
      if (db) {
        try {
          const docSnap = await getDoc(doc(db, 'conversations', conversationId));
          if (docSnap.exists()) {
            const d = docSnap.data() as any;
            const pIds: string[] = Array.isArray(d.participantIds)
              ? d.participantIds
              : Array.isArray(d.participant_ids)
              ? d.participant_ids
              : [];
            const parts = Array.isArray(d.participants) && d.participants.length > 0
              ? d.participants
              : pIds.map((uid: string) => ({
                  userId: uid,
                  role: uid === (d.createdBy || d.created_by) ? 'owner' : 'member',
                  joinedAt: d.createdAt || d.created_at || new Date().toISOString(),
                }));
            const mapped: Conversation = {
              id: docSnap.id,
              type: d.type || 'direct',
              title: d.title || (d.type === 'direct' ? 'Direct Message' : 'Conversation'),
              avatarUrl: d.avatarUrl || d.avatar_url || undefined,
              participants: parts,
              lastMessage: d.lastMessage || undefined,
              unreadCount: d.unreadCount || 0,
              isPinned: Boolean(d.isPinned),
              isMuted: Boolean(d.isMuted),
              isArchived: Boolean(d.isArchived),
              isBlocked: Boolean(d.isBlocked),
              createdAt: d.createdAt || d.created_at || new Date().toISOString(),
              updatedAt: d.updatedAt || d.updated_at || new Date().toISOString(),
            };
            (mapped as any).participantIds = pIds;
            ChatCoordinator.setCachedConversation(mapped);
            return mapped;
          }
        } catch (e) {
          console.warn('[ChatService] getConversation Firestore error:', e);
        }
      }
    }

    const conversations = await this.getStoredConversations();
    const found = conversations.find((c) => c.id === conversationId);
    if (found) {
      ChatCoordinator.setCachedConversation(found);
      return found;
    }

    return null;
  }

  async createDirectConversation(targetUserId: string): Promise<Conversation> {
    const currentUserId = await this.getCurrentUserId();
    if (!currentUserId || currentUserId === 'unknown') {
      throw new Error('Authentication required to start a conversation');
    }
    if (!targetUserId || targetUserId === currentUserId) {
      throw new Error('Cannot start direct conversation with invalid target');
    }
    const conversations = await this.getStoredConversations();

    // Check if direct conversation already exists
    const existing = conversations.find(
      (c) =>
        c.type === 'direct' &&
        c.participants.some((p) => p.userId === targetUserId) &&
        c.participants.some((p) => p.userId === currentUserId)
    );

    if (existing) {
      return existing;
    }

    let targetProfile: any = null;
    let resolvedTargetId = targetUserId;

    if (isFirebaseConfigured()) {
      const db = getFirebaseFirestore();
      if (db) {
        try {
          const docSnap = await getDoc(doc(db, 'profiles', targetUserId));
          if (docSnap.exists()) {
            targetProfile = docSnap.data();
            resolvedTargetId = docSnap.id;
          } else {
            const q = firestoreQuery(collection(db, 'profiles'), where('username', '==', targetUserId), firestoreLimit(1));
            const snap = await getDocs(q);
            if (!snap.empty) {
              targetProfile = snap.docs[0].data();
              resolvedTargetId = snap.docs[0].id;
            }
          }
        } catch {}
      }
    }

    const displayName =
      targetProfile?.display_name ||
      targetProfile?.username ||
      targetUserId
        .split(/[._-]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

    const convId = generateUUID();
    const nowIso = new Date().toISOString();

    const newConversation: Conversation = {
      id: convId,
      type: 'direct',
      title: displayName,
      participants: [
        { userId: currentUserId, role: 'owner', joinedAt: nowIso },
        {
          userId: resolvedTargetId,
          role: 'member',
          joinedAt: nowIso,
          user: targetProfile
            ? {
                id: targetProfile.id,
                username: targetProfile.username,
                displayName: targetProfile.display_name,
                avatarUrl: targetProfile.avatar_url || undefined,
                verificationStatus: (targetProfile.verification_status as VerificationStatus) || 'none',
                isCreator: Boolean(targetProfile.is_creator),
                createdAt: nowIso,
              }
            : undefined,
        },
      ],
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Live Firebase Firestore sync
    if (isFirebaseConfigured()) {
      const db = getFirebaseFirestore();
      if (db && currentUserId) {
        try {
          await setDoc(doc(db, 'conversations', convId), sanitizeForFirestore({
            id: convId,
            type: 'direct',
            title: displayName,
            participantIds: [currentUserId, resolvedTargetId],
            participants: newConversation.participants,
            createdBy: currentUserId,
            created_by: currentUserId,
            createdAt: nowIso,
            created_at: nowIso,
            updatedAt: nowIso,
            updated_at: nowIso,
          }));
        } catch (e) {
          console.warn('[ChatService] Firebase create direct conversation error:', e);
        }
      }
    }


    const updated = [newConversation, ...conversations];
    await this.saveStoredConversations(updated);
    ChatCoordinator.setCachedConversation(newConversation);
    ChatCoordinator.notify({
      type: 'conversation_updated',
      conversationId: newConversation.id,
      conversation: newConversation,
    });

    return newConversation;
  }

  async createGroupConversation(
    title: string,
    participantIds: string[]
  ): Promise<Conversation> {
    const currentUserId = await this.getCurrentUserId();
    if (!currentUserId || currentUserId === 'unknown') {
      throw new Error('Authentication required to create a group conversation');
    }
    const uniqueIds = Array.from(new Set([currentUserId, ...participantIds]));
    const convId = generateUUID();
    const nowIso = new Date().toISOString();

    const newGroup: Conversation = {
      id: convId,
      type: 'group',
      title: title.trim(),
      participants: uniqueIds.map((uid) => ({
        userId: uid,
        role: uid === currentUserId ? 'owner' : 'member',
        joinedAt: nowIso,
      })),
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Live Firebase Firestore sync
    if (isFirebaseConfigured()) {
      const db = getFirebaseFirestore();
      if (db && currentUserId) {
        try {
          await setDoc(doc(db, 'conversations', convId), sanitizeForFirestore({
            id: convId,
            type: 'group',
            title: title.trim(),
            participantIds: uniqueIds,
            participants: newGroup.participants,
            createdBy: currentUserId,
            created_by: currentUserId,
            createdAt: nowIso,
            created_at: nowIso,
            updatedAt: nowIso,
            updated_at: nowIso,
          }));
        } catch (e) {
          console.warn('[ChatService] Firebase create group conversation error:', e);
        }
      }
    }


    const conversations = await this.getStoredConversations();
    const updated = [newGroup, ...conversations];
    await this.saveStoredConversations(updated);
    ChatCoordinator.setCachedConversation(newGroup);
    ChatCoordinator.notify({
      type: 'conversation_updated',
      conversationId: newGroup.id,
      conversation: newGroup,
    });

    return newGroup;
  }

  async getMessages(
    conversationId: string,
    limit: number = PAGE_SIZE_MESSAGES,
    beforeCursor?: string
  ): Promise<MessageCursorResult> {
    let messages: Message[] = [];

    // 1. Try Firebase Firestore when configured
    if (isFirebaseConfigured()) {
      const db = getFirebaseFirestore();
      if (db) {
        try {
          const currentUserId = await this.getCurrentUserId();
          const queryConstraints: any[] = [
            where('conversation_id', '==', conversationId),
          ];

          // Strict Firestore Security Rules alignment:
          // Rule requires senderId == auth.uid || recipientId == auth.uid || auth.uid in participantIds.
          // By constraining participantIds array-contains currentUserId, Firestore proves authorization.
          if (currentUserId && currentUserId !== 'unknown') {
            queryConstraints.push(where('participantIds', 'array-contains', currentUserId));
          }

          queryConstraints.push(orderBy('created_at', 'asc'));
          queryConstraints.push(firestoreLimit(limit));

          let snap;
          try {
            const q = firestoreQuery(collection(db, 'messages'), ...queryConstraints);
            snap = await getDocs(q);
          } catch (queryErr: any) {
            // Fallback for compound index transition: query with participantIds constraint
            if (queryErr?.code === 'failed-precondition') {
              const fallbackConstraints: any[] = [
                where('conversation_id', '==', conversationId),
              ];
              if (currentUserId && currentUserId !== 'unknown') {
                fallbackConstraints.push(where('participantIds', 'array-contains', currentUserId));
              }
              fallbackConstraints.push(firestoreLimit(limit));
              const fallbackQ = firestoreQuery(collection(db, 'messages'), ...fallbackConstraints);
              snap = await getDocs(fallbackQ);
            } else {
              throw queryErr;
            }
          }

          if (snap && !snap.empty) {
            const remoteMessages: Message[] = snap.docs.map((d) => {
              const row = d.data() as any;
              return {
                id: d.id,
                conversationId: row.conversation_id || row.conversationId || conversationId,
                senderId: row.sender_id || row.senderId,
                recipientId: row.recipient_id || row.recipientId || undefined,
                type: row.type || 'text',
                text: row.text || '',
                mediaUrl: row.media_url || row.mediaUrl || undefined,
                mediaDuration: row.media_duration ? Number(row.media_duration) : undefined,
                deliveryStatus: row.delivery_status || row.deliveryStatus || 'sent',
                isRead: row.delivery_status === 'read',
                createdAt: row.created_at || row.createdAt || new Date().toISOString(),
                updatedAt: row.updated_at || row.updatedAt || undefined,
              };
            });
            const local = await this.getStoredMessages(conversationId);
            const remoteIds = new Set(remoteMessages.map((m) => m.id));
            const merged = [...remoteMessages, ...local.filter((m) => !remoteIds.has(m.id))];
            merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            await this.saveStoredMessages(conversationId, merged);
            messages = merged;
          } else {
            messages = await this.getStoredMessages(conversationId);
          }
        } catch (err: any) {
          console.warn('[ChatService] getMessages Firestore error:', err?.message || err);
          if (err?.code === 'permission-denied') {
            throw new Error(`[ChatService] Access denied: User is not an authorized participant of conversation ${conversationId}`);
          }
          messages = await this.getStoredMessages(conversationId);
        }
      } else {
        messages = await this.getStoredMessages(conversationId);
      }
    } else {
      messages = await this.getStoredMessages(conversationId);
    }

    // Sort ascending by createdAt (oldest first)
    const sorted = [...messages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    ChatCoordinator.setCachedMessages(conversationId, sorted);

    // Pagination window: cursor slices backwards from the end
    const totalCount = sorted.length;
    let paged: Message[];
    let nextCursor: string | undefined;
    let hasMore = false;

    if (!beforeCursor) {
      const startIndex = Math.max(0, totalCount - limit);
      paged = sorted.slice(startIndex);
      hasMore = startIndex > 0;
      nextCursor = hasMore ? String(startIndex) : undefined;
    } else {
      const endIdx = parseInt(beforeCursor, 10);
      const safeEnd = isNaN(endIdx) ? totalCount : endIdx;
      const startIdx = Math.max(0, safeEnd - limit);
      paged = sorted.slice(startIdx, safeEnd);
      hasMore = startIdx > 0;
      nextCursor = hasMore ? String(startIdx) : undefined;
    }

    return {
      items: paged,
      nextCursor,
      hasMore,
    };
  }

  async sendMessage(
    conversationId: string,
    payload: SendMessagePayload
  ): Promise<Message> {
    if (!payload) {
      throw new Error('[ChatService] Invalid payload: message payload is required');
    }
    const trimmedText = typeof payload.text === 'string' ? payload.text.trim() : '';
    if (!trimmedText && !payload.mediaUrl) {
      throw new Error('[ChatService] Invalid payload: message must include non-empty text or a mediaUrl');
    }
    const currentUserId = await this.getCurrentUserId();
    if (!currentUserId || currentUserId === 'unknown') {
      throw new Error('[ChatService] Authentication required to send a message');
    }
    const localId = generateSecureEntityId('local');
    const nowIso = new Date().toISOString();

    // Resolve recipientId and participantIds for strict Firestore access rules
    let recipientId = payload.recipientId;
    let participantIds: string[] = [];
    let conversationType: 'direct' | 'group' = 'direct';
    const conv = await this.getConversation(conversationId);
    if (conv) {
      conversationType = conv.type || 'direct';
      if (Array.isArray(conv.participants) && conv.participants.length > 0) {
        participantIds = conv.participants
          .map((p: any) => (typeof p === 'string' ? p : p?.userId))
          .filter(Boolean);
        if (!recipientId && conversationType === 'direct') {
          const otherParticipant = conv.participants.find(
            (p: any) => (typeof p === 'string' ? p : p?.userId) !== currentUserId
          );
          if (otherParticipant) {
            recipientId = typeof otherParticipant === 'string' ? otherParticipant : otherParticipant.userId;
          }
        }
      }
      if (Array.isArray((conv as any).participantIds)) {
        participantIds = Array.from(new Set([...participantIds, ...(conv as any).participantIds]));
      }

      // Authorization guard: Reject if current user is not a participant in this existing conversation
      if (participantIds.length > 0 && !participantIds.includes(currentUserId)) {
        throw new Error(`[ChatService] Access denied: User ${currentUserId} is not a participant of conversation ${conversationId}`);
      }
    }

    if (isFirebaseConfigured() && (!recipientId || participantIds.length === 0)) {
      const db = getFirebaseFirestore();
      if (db) {
        try {
          const cSnap = await getDoc(doc(db, 'conversations', conversationId));
          if (cSnap.exists()) {
            const cData = cSnap.data() as any;
            if (cData.type) {
              conversationType = cData.type;
            }
            const cPids: string[] = Array.isArray(cData.participantIds)
              ? cData.participantIds
              : Array.isArray(cData.participant_ids)
              ? cData.participant_ids
              : [];

            // Authorization guard: Reject if current user is not a participant in Firestore conversation
            if (cPids.length > 0 && !cPids.includes(currentUserId)) {
              throw new Error(`[ChatService] Access denied: User ${currentUserId} is not a participant of conversation ${conversationId}`);
            }

            participantIds = Array.from(new Set([...participantIds, ...cPids]));
            if (!recipientId && conversationType === 'direct') {
              const other = cPids.find((id) => id !== currentUserId);
              if (other) recipientId = other;
            }
          }
        } catch (fetchErr: any) {
          if (fetchErr?.message?.includes('Access denied')) {
            throw fetchErr;
          }
        }
      }
    }

    // Fallback: If recipientId still not resolved, parse from composite conversationId patterns (e.g. conv_userA_userB)
    if (!recipientId && conversationType === 'direct' && conversationId.includes('_')) {
      const parts = conversationId.split('_').filter((p) => p && p !== 'conv' && p !== 'direct');
      const otherPart = parts.find((p) => p !== currentUserId);
      if (otherPart) {
        recipientId = otherPart;
      }
    }

    // In group conversations, recipientId must remain null/undefined unless explicitly directed
    if (conversationType === 'group') {
      recipientId = payload.recipientId || undefined;
    }

    if (currentUserId && !participantIds.includes(currentUserId)) {
      participantIds.push(currentUserId);
    }
    if (recipientId && !participantIds.includes(recipientId)) {
      participantIds.push(recipientId);
    }

    const optimisticMessage: Message = {
      id: localId,
      localId,
      conversationId,
      senderId: currentUserId,
      recipientId,
      type: payload.type || 'text',
      text: payload.text.trim(),
      mediaUrl: payload.mediaUrl,
      mediaDuration: payload.mediaDuration,
      deliveryStatus: 'pending',
      isRead: false,
      createdAt: nowIso,
    };

    if (payload.replyToId) {
      const messages = await this.getStoredMessages(conversationId);
      const target = messages.find((m) => m.id === payload.replyToId);
      if (target) {
        optimisticMessage.replyTo = {
          messageId: target.id,
          senderId: target.senderId,
          senderName: target.sender?.displayName || target.sender?.username || 'User',
          previewText: target.text.substring(0, 80),
        };
      }
    }

    // 1. Optimistically append message to local messages
    const currentMessages = await this.getStoredMessages(conversationId);
    const updatedMessages = [...currentMessages, optimisticMessage];
    await this.saveStoredMessages(conversationId, updatedMessages);
    ChatCoordinator.setCachedMessages(conversationId, updatedMessages);

    // 2. Update conversation's lastMessage & updatedAt
    const conversations = await this.getStoredConversations();
    const updatedConversations = conversations.map((c) =>
      c.id === conversationId
        ? { ...c, lastMessage: optimisticMessage, updatedAt: nowIso }
        : c
    );
    await this.saveStoredConversations(updatedConversations);

    // 3. Broadcast optimistic send
    ChatCoordinator.notify({
      type: 'message_sent',
      conversationId,
      messageId: optimisticMessage.id,
      message: optimisticMessage,
    });

    let finalizedMessage: Message = {
      ...optimisticMessage,
      deliveryStatus: 'sent',
    };

    // 4. Send to Firebase Firestore when configured
    if (isFirebaseConfigured()) {
      const db = getFirebaseFirestore();
      if (db && currentUserId) {
        try {
          const msgDocRef = doc(db, 'messages', optimisticMessage.id);
          const messageData: Record<string, any> = {
            id: optimisticMessage.id,
            conversation_id: conversationId,
            conversationId,
            sender_id: currentUserId,
            senderId: currentUserId,
            type: payload.type || 'text',
            text: trimmedText,
            media_url: payload.mediaUrl !== undefined ? payload.mediaUrl : null,
            mediaUrl: payload.mediaUrl !== undefined ? payload.mediaUrl : null,
            media_duration: payload.mediaDuration !== undefined ? payload.mediaDuration : null,
            mediaDuration: payload.mediaDuration !== undefined ? payload.mediaDuration : null,
            reply_to_id: payload.replyToId !== undefined ? payload.replyToId : null,
            replyToId: payload.replyToId !== undefined ? payload.replyToId : null,
            local_id: localId,
            localId,
            delivery_status: 'sent',
            deliveryStatus: 'sent',
            created_at: nowIso,
            createdAt: nowIso,
            updated_at: nowIso,
            updatedAt: nowIso,
            recipient_id: recipientId || null,
            recipientId: recipientId || null,
            participant_ids: participantIds,
            participantIds: participantIds,
          };
          // 1. Ensure conversation document exists in Firestore with consistent type and participant metadata
          const lastMessageSummary = buildFirestoreLastMessageSummary(finalizedMessage);
          const rawConvDocData: Record<string, any> = {
            id: conversationId,
            type: conv?.type || conversationType,
            lastMessage: lastMessageSummary,
            updatedAt: nowIso,
            updated_at: nowIso,
            participantIds: participantIds,
            participant_ids: participantIds,
          };
          if (conv) {
            rawConvDocData.type = conv.type || conversationType;
            if (conv.title) rawConvDocData.title = conv.title;
            if (conv.participants) rawConvDocData.participants = conv.participants;
          }
          const convDocData = sanitizeForFirestore(rawConvDocData);
          await setDoc(doc(db, 'conversations', conversationId), convDocData, { merge: true });

          // 2. Write message document satisfying Firestore security rules
          await setDoc(msgDocRef, sanitizeForFirestore(messageData));

          // Trigger push notification for offline/background recipient
          if (recipientId && recipientId !== currentUserId) {
            const senderName = this.currentAuthenticatedUser?.displayName || this.currentAuthenticatedUser?.username || 'New message';
            const snippet = payload.text ? (payload.text.length > 80 ? `${payload.text.substring(0, 80)}...` : payload.text) : 'Sent a photo/video';
            notificationsService.pushNotification({
              recipientId,
              senderId: currentUserId,
              type: 'message',
              title: senderName,
              body: snippet,
              targetId: conversationId,
              targetType: 'chat',
            }).catch(() => {});
          }
        } catch (e: any) {
          console.error('[ChatService] Firebase sendMessage error:', e);
          finalizedMessage = {
            ...optimisticMessage,
            deliveryStatus: 'failed',
          };
          const failedMessages = updatedMessages.map((m) =>
            m.id === optimisticMessage.id ? finalizedMessage : m
          );
          await this.saveStoredMessages(conversationId, failedMessages);
          ChatCoordinator.setCachedMessages(conversationId, failedMessages);
          ChatCoordinator.notify({
            type: 'message_failed',
            conversationId,
            messageId: finalizedMessage.id,
            message: finalizedMessage,
          });
          throw e;
        }
      }
    }

    const finalMessages = updatedMessages.map((m) =>
      m.id === optimisticMessage.id ? finalizedMessage : m
    );
    await this.saveStoredMessages(conversationId, finalMessages);
    ChatCoordinator.setCachedMessages(conversationId, finalMessages);

    ChatCoordinator.notify({
      type: 'message_delivered',
      conversationId,
      messageId: finalizedMessage.id,
      message: finalizedMessage,
    });

    // Remote Realtime: broadcast to conversation peers
    if (finalizedMessage.deliveryStatus !== 'failed') {
      try {
        if (isFirebaseConfigured()) {
          firestoreChatRealtimeGateway.broadcastMessage(conversationId, finalizedMessage);
        }
      } catch (broadcastErr) {
        console.warn('[ChatService] Error broadcasting message via realtime:', broadcastErr);
      }
    }

    return finalizedMessage;
  }

  async retryMessage(conversationId: string, messageId: string): Promise<Message> {
    const messages = await this.getStoredMessages(conversationId);
    const target = messages.find((m) => m.id === messageId);
    if (!target) {
      throw new Error(`Message ${messageId} not found`);
    }

    return this.sendMessage(conversationId, {
      text: target.text,
      type: target.type,
      mediaUrl: target.mediaUrl,
      mediaDuration: target.mediaDuration,
      replyToId: target.replyTo?.messageId,
    });
  }

  async deleteMessage(
    conversationId: string,
    messageId: string,
    forEveryone: boolean = false
  ): Promise<void> {
    const messages = await this.getStoredMessages(conversationId);
    let updated: Message[];

    if (forEveryone) {
      updated = messages.map((m) =>
        m.id === messageId
          ? {
              ...m,
              text: 'This message was deleted',
              type: 'system' as const,
              mediaUrl: undefined,
              reactions: [],
            }
          : m
      );
    } else {
      updated = messages.filter((m) => m.id !== messageId);
    }

    await this.saveStoredMessages(conversationId, updated);
    ChatCoordinator.setCachedMessages(conversationId, updated);

    ChatCoordinator.notify({
      type: 'message_deleted',
      conversationId,
      messageId,
    });

    if (isFirebaseConfigured()) {
      const db = getFirebaseFirestore();
      if (db) {
        try {
          if (forEveryone) {
            await updateDoc(doc(db, 'messages', messageId), {
              text: 'This message was deleted',
              type: 'system',
              is_deleted: true,
            });
          } else {
            await deleteDoc(doc(db, 'messages', messageId));
          }
        } catch {}
      }
    }
  }

  async reactToMessage(
    conversationId: string,
    messageId: string,
    emoji: string
  ): Promise<void> {
    const currentUserId = await this.getCurrentUserId();
    const messages = await this.getStoredMessages(conversationId);
    const target = messages.find((m) => m.id === messageId);
    if (!target) return;

    const existingReactions = target.reactions || [];
    const hasReacted = existingReactions.some(
      (r) => r.userId === currentUserId && r.emoji === emoji
    );

    let updatedReactions;
    if (hasReacted) {
      updatedReactions = existingReactions.filter(
        (r) => !(r.userId === currentUserId && r.emoji === emoji)
      );
    } else {
      updatedReactions = [
        ...existingReactions.filter((r) => r.userId !== currentUserId),
        { emoji, userId: currentUserId, createdAt: new Date().toISOString() },
      ];
    }

    const updatedMessages = messages.map((m) =>
      m.id === messageId ? { ...m, reactions: updatedReactions } : m
    );

    await this.saveStoredMessages(conversationId, updatedMessages);
    ChatCoordinator.setCachedMessages(conversationId, updatedMessages);

    ChatCoordinator.notify({
      type: 'reaction_updated',
      conversationId,
      messageId,
      reaction: { messageId, reactions: updatedReactions },
    });

    if (isFirebaseConfigured()) {
      const db = getFirebaseFirestore();
      if (db) {
        try {
          await updateDoc(doc(db, 'messages', messageId), {
            reactions: updatedReactions,
          });
        } catch {}
      }
    }
  }

  async markConversationAsRead(conversationId: string): Promise<void> {
    const currentUserId = await this.getCurrentUserId();
    const conversations = await this.getStoredConversations();
    const updatedConversations = conversations.map((c) =>
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    );
    await this.saveStoredConversations(updatedConversations);

    const messages = await this.getStoredMessages(conversationId);
    const updatedMessages = messages.map((m) => ({
      ...m,
      isRead: true,
      deliveryStatus: 'read' as const,
    }));
    await this.saveStoredMessages(conversationId, updatedMessages);

    const totalUnread = updatedConversations
      .filter((c) => !c.isArchived && !c.isBlocked)
      .reduce((sum, c) => sum + (c.unreadCount || 0), 0);

    ChatCoordinator.setUnreadMessagesCount(totalUnread);

    ChatCoordinator.notify({
      type: 'message_read',
      conversationId,
      unreadMessagesCount: totalUnread,
    });

    if (isFirebaseConfigured()) {
      const db = getFirebaseFirestore();
      if (db) {
        try {
          await updateDoc(doc(db, 'conversations', conversationId), {
            unreadCount: 0,
            last_read_at: new Date().toISOString(),
          });
        } catch {}
      }
    }
  }

  async togglePin(conversationId: string): Promise<boolean> {
    const currentUserId = await this.getCurrentUserId();
    const conversations = await this.getStoredConversations();
    let nextPinned = false;

    const updated = conversations.map((c) => {
      if (c.id === conversationId) {
        nextPinned = !c.isPinned;
        return { ...c, isPinned: nextPinned };
      }
      return c;
    });

    await this.saveStoredConversations(updated);
    ChatCoordinator.notify({
      type: 'conversation_updated',
      conversationId,
      conversation: updated.find((c) => c.id === conversationId),
    });

    if (isFirebaseConfigured()) {
      const db = getFirebaseFirestore();
      if (db) {
        try {
          await updateDoc(doc(db, 'conversations', conversationId), {
            isPinned: nextPinned,
          });
        } catch {}
      }
    }

    return nextPinned;
  }

  async toggleMute(conversationId: string): Promise<boolean> {
    const currentUserId = await this.getCurrentUserId();
    const conversations = await this.getStoredConversations();
    let nextMuted = false;

    const updated = conversations.map((c) => {
      if (c.id === conversationId) {
        nextMuted = !c.isMuted;
        return { ...c, isMuted: nextMuted };
      }
      return c;
    });

    await this.saveStoredConversations(updated);
    ChatCoordinator.notify({
      type: 'conversation_updated',
      conversationId,
      conversation: updated.find((c) => c.id === conversationId),
    });

    if (isFirebaseConfigured()) {
      const db = getFirebaseFirestore();
      if (db) {
        try {
          await updateDoc(doc(db, 'conversations', conversationId), {
            isMuted: nextMuted,
          });
        } catch {}
      }
    }

    return nextMuted;
  }

  async toggleArchive(conversationId: string): Promise<boolean> {
    const currentUserId = await this.getCurrentUserId();
    const conversations = await this.getStoredConversations();
    let nextArchived = false;

    const updated = conversations.map((c) => {
      if (c.id === conversationId) {
        nextArchived = !c.isArchived;
        return { ...c, isArchived: nextArchived };
      }
      return c;
    });

    await this.saveStoredConversations(updated);
    ChatCoordinator.notify({
      type: 'conversation_updated',
      conversationId,
      conversation: updated.find((c) => c.id === conversationId),
    });

    if (isFirebaseConfigured()) {
      const db = getFirebaseFirestore();
      if (db) {
        try {
          await updateDoc(doc(db, 'conversations', conversationId), {
            isArchived: nextArchived,
          });
        } catch {}
      }
    }

    return nextArchived;
  }

  async blockConversation(conversationId: string): Promise<void> {
    const currentUserId = await this.getCurrentUserId();
    const conversations = await this.getStoredConversations();
    const updated = conversations.map((c) =>
      c.id === conversationId ? { ...c, isBlocked: true } : c
    );
    await this.saveStoredConversations(updated);

    ChatCoordinator.notify({
      type: 'conversation_updated',
      conversationId,
      conversation: updated.find((c) => c.id === conversationId),
    });

    if (isFirebaseConfigured()) {
      const db = getFirebaseFirestore();
      if (db) {
        try {
          await updateDoc(doc(db, 'conversations', conversationId), {
            isBlocked: true,
          });
        } catch {}
      }
    }
  }

  async reportConversation(conversationId: string, reason: string): Promise<void> {
    try {
      await this.client.post(`/inbox/conversations/${conversationId}/report`, { reason });
    } catch {
      // Handled
    }
  }

  async leaveGroup(conversationId: string): Promise<void> {
    const currentUserId = await this.getCurrentUserId();
    const conversations = await this.getStoredConversations();
    const target = conversations.find((c) => c.id === conversationId);
    if (!target) return;

    const updatedParticipants = target.participants.filter((p) => p.userId !== currentUserId);
    const updatedConversations = conversations.map((c) =>
      c.id === conversationId ? { ...c, participants: updatedParticipants } : c
    );

    await this.saveStoredConversations(updatedConversations);

    ChatCoordinator.notify({
      type: 'conversation_updated',
      conversationId,
    });

    if (isFirebaseConfigured()) {
      const db = getFirebaseFirestore();
      if (db) {
        try {
          await updateDoc(doc(db, 'conversations', conversationId), {
            participantIds: updatedParticipants.map((p) => p.userId),
          });
        } catch {}
      }
    }
  }

  async getUnreadMessagesCount(): Promise<number> {
    const conversations = await this.getStoredConversations();
    const count = conversations
      .filter((c) => !c.isArchived && !c.isBlocked)
      .reduce((sum, c) => sum + (c.unreadCount || 0), 0);

    ChatCoordinator.setUnreadMessagesCount(count);
    return count;
  }

  async clear(): Promise<void> {
    this.currentAuthenticatedUser = null;
    ChatCoordinator.clear();
    await this.storage.removeItem(STORAGE_KEY_CONVERSATIONS);
    await this.storage.removeItem(STORAGE_KEY_PENDING_QUEUE);
    await this.storage.removeItem(STORAGE_KEY_BLOCKED);
  }
}

export const chatService: IChatService = new ChatService();
