import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Chat Message Send Permission & Recipient Participant Security Invariants', () => {
  const rootDir = process.cwd();
  const rulesContent = fs.readFileSync(path.join(rootDir, 'firestore.rules'), 'utf8');
  const chatServiceContent = fs.readFileSync(path.join(rootDir, 'src/services/chat/ChatService.ts'), 'utf8');

  // Firestore Rules Evaluation Mirror for /messages/{messageId}
  function evaluateMessageCreate(authUid, messageData, conversationDoc = null, blockedMap = new Set()) {
    if (!authUid) return false;

    // 1. Sender identity verification (cannot forge sender)
    const isSender = messageData.senderId === authUid || messageData.sender_id === authUid;
    if (!isSender) return false;

    // 2. Participant verification: sender must be included in participantIds
    const pIds = messageData.participantIds || messageData.participant_ids;
    if (!Array.isArray(pIds) || !pIds.includes(authUid)) return false;

    // 3. Recipient policy:
    const recId = messageData.recipientId !== undefined ? messageData.recipientId : messageData.recipient_id;
    if (recId !== null && recId !== undefined) {
      // Direct message: explicit recipient, not sender, recipient not blocked, and recipient in participantIds
      if (recId === authUid) return false;
      if (blockedMap.has(`${recId}_${authUid}`)) return false; // recipient blocked sender
      if (!pIds.includes(recId)) return false;
    } else {
      // Group message policy: recipientId can only be null/omitted if conversation exists, is group type, and sender is a verified member
      if (!conversationDoc) return false;
      if (conversationDoc.type !== 'group') return false;
      const convPids = conversationDoc.participantIds || conversationDoc.participant_ids;
      if (!Array.isArray(convPids) || !convPids.includes(authUid)) return false;
    }

    // 4. Conversation boundary protection: sender must be in conversation if document exists
    if (conversationDoc) {
      const convPids = conversationDoc.participantIds || conversationDoc.participant_ids;
      if (Array.isArray(convPids) && !convPids.includes(authUid)) {
        return false;
      }
    }

    return true;
  }

  function evaluateMessageRead(authUid, messageData) {
    if (!authUid) return false;
    const isSender = messageData.senderId === authUid || messageData.sender_id === authUid;
    const isRecipient = messageData.recipientId === authUid || messageData.recipient_id === authUid;
    const pIds = messageData.participantIds || messageData.participant_ids;
    const inParticipants = Array.isArray(pIds) && pIds.includes(authUid);
    return isSender || isRecipient || inParticipants;
  }

  it('1. Legitimate sender Alice can send message to intended recipient Bob', () => {
    const message = {
      id: 'msg_1',
      conversationId: 'conv_alice_bob',
      senderId: 'user_alice',
      recipientId: 'user_bob',
      participantIds: ['user_alice', 'user_bob'],
      text: 'Hey Bob!'
    };
    const conversation = {
      id: 'conv_alice_bob',
      participantIds: ['user_alice', 'user_bob']
    };

    const allowed = evaluateMessageCreate('user_alice', message, conversation);
    assert.strictEqual(allowed, true, 'Legitimate message send must be ALLOWED');
  });

  it('2. Intended recipient Bob can access and read the message', () => {
    const message = {
      id: 'msg_1',
      conversationId: 'conv_alice_bob',
      senderId: 'user_alice',
      recipientId: 'user_bob',
      participantIds: ['user_alice', 'user_bob'],
      text: 'Hey Bob!'
    };

    const allowed = evaluateMessageRead('user_bob', message);
    assert.strictEqual(allowed, true, 'Recipient must be ALLOWED to read message');
  });

  it('3. Unrelated third party Eve cannot access or read the message', () => {
    const message = {
      id: 'msg_1',
      conversationId: 'conv_alice_bob',
      senderId: 'user_alice',
      recipientId: 'user_bob',
      participantIds: ['user_alice', 'user_bob'],
      text: 'Secret chat'
    };

    const allowed = evaluateMessageRead('user_eve', message);
    assert.strictEqual(allowed, false, 'Unrelated third party reading message must be DENIED');
  });

  it('4. Unrelated third party Eve cannot inject a message into Alice and Bob conversation', () => {
    const injectedMessage = {
      id: 'msg_injected',
      conversationId: 'conv_alice_bob',
      senderId: 'user_eve',
      recipientId: 'user_bob',
      participantIds: ['user_eve', 'user_bob'],
      text: 'Rogue message from Eve'
    };
    // The existing conversation between Alice & Bob does NOT include Eve
    const conversation = {
      id: 'conv_alice_bob',
      participantIds: ['user_alice', 'user_bob']
    };

    const allowed = evaluateMessageCreate('user_eve', injectedMessage, conversation);
    assert.strictEqual(allowed, false, 'Third-party injecting into someone else conversation must be DENIED');
  });

  it('5. Sender forging another user identity is strictly rejected', () => {
    const forgedMessage = {
      id: 'msg_forged',
      conversationId: 'conv_alice_bob',
      senderId: 'user_bob', // Alice claiming to be Bob
      recipientId: 'user_charlie',
      participantIds: ['user_bob', 'user_charlie'],
      text: 'Forged sender'
    };

    const allowed = evaluateMessageCreate('user_alice', forgedMessage);
    assert.strictEqual(allowed, false, 'Forging senderId must be DENIED');
  });

  it('6. Message with missing participantIds or missing sender in participantIds is rejected', () => {
    const invalidMessage1 = {
      id: 'msg_bad_1',
      conversationId: 'conv_alice_bob',
      senderId: 'user_alice',
      recipientId: 'user_bob',
      // participantIds missing
      text: 'Missing participantIds'
    };
    assert.strictEqual(evaluateMessageCreate('user_alice', invalidMessage1), false, 'Missing participantIds must be DENIED');

    const invalidMessage2 = {
      id: 'msg_bad_2',
      conversationId: 'conv_alice_bob',
      senderId: 'user_alice',
      recipientId: 'user_bob',
      participantIds: ['user_bob'], // sender omitted from participantIds
      text: 'Sender omitted'
    };
    assert.strictEqual(evaluateMessageCreate('user_alice', invalidMessage2), false, 'Omitted sender in participantIds must be DENIED');
  });

  it('7. Message sending to a recipient who blocked the sender is rejected', () => {
    const blockedMap = new Set(['user_bob_user_alice']); // Bob blocked Alice
    const message = {
      id: 'msg_blocked',
      conversationId: 'conv_alice_bob',
      senderId: 'user_alice',
      recipientId: 'user_bob',
      participantIds: ['user_alice', 'user_bob'],
      text: 'Should be blocked'
    };

    const allowed = evaluateMessageCreate('user_alice', message, null, blockedMap);
    assert.strictEqual(allowed, false, 'Sending to blocker must be DENIED');
  });

  it('8. ChatService always writes recipientId and participantIds to Firestore message payload', () => {
    assert.ok(
      chatServiceContent.includes('recipientId: recipientId || null'),
      'ChatService must always write recipientId in messageData'
    );
    assert.ok(
      chatServiceContent.includes('participantIds: participantIds'),
      'ChatService must always write participantIds in messageData'
    );
  });

  it('9. ChatService does NOT silently mask Firestore write failure as delivered', () => {
    assert.ok(
      chatServiceContent.includes("deliveryStatus: 'failed'"),
      'Failed Firestore send must set deliveryStatus to failed'
    );
    assert.ok(
      chatServiceContent.includes("type: 'message_failed'"),
      'Failed Firestore send must broadcast message_failed'
    );
    assert.ok(
      chatServiceContent.includes('throw e;'),
      'Failed Firestore send must throw error rather than returning fake success'
    );
  });

  it('10. Unauthenticated sender cannot send message or create conversations', () => {
    assert.ok(
      chatServiceContent.includes("!currentUserId || currentUserId === 'unknown'"),
      'ChatService must verify current user authentication'
    );
    assert.ok(
      chatServiceContent.includes("throw new Error('[ChatService] Authentication required to send a message')"),
      'Must reject unauthenticated message send'
    );
    assert.ok(
      chatServiceContent.includes("throw new Error('Authentication required to create a group conversation')"),
      'Must reject unauthenticated group conversation creation'
    );
    assert.ok(
      chatServiceContent.includes("throw new Error('Authentication required to start a conversation')"),
      'Must reject unauthenticated direct conversation creation'
    );
  });

  it('11. Non-participant cannot send message into existing conversation', () => {
    assert.ok(
      chatServiceContent.includes('is not a participant of conversation'),
      'ChatService must reject sends from non-participants of existing conversations'
    );
    assert.ok(
      chatServiceContent.includes('participantIds.length > 0 && !participantIds.includes(currentUserId)'),
      'ChatService must verify current user membership in local participantIds'
    );
    assert.ok(
      chatServiceContent.includes('cPids.length > 0 && !cPids.includes(currentUserId)'),
      'ChatService must verify current user membership in remote Firestore participantIds'
    );
  });

  it('12. Group messages allow null recipientId and validate full participantIds membership', () => {
    const groupMessage = {
      id: 'msg_group_1',
      conversationId: 'conv_group_123',
      senderId: 'user_alice',
      recipientId: null,
      participantIds: ['user_alice', 'user_bob', 'user_charlie'],
      text: 'Hello team!'
    };
    const groupConversation = {
      id: 'conv_group_123',
      type: 'group',
      participantIds: ['user_alice', 'user_bob', 'user_charlie']
    };

    const allowed = evaluateMessageCreate('user_alice', groupMessage, groupConversation);
    assert.strictEqual(allowed, true, 'Group message with null recipientId must be ALLOWED for participants');

    // Unrelated user Dave cannot send to group
    const daveAllowed = evaluateMessageCreate('user_dave', { ...groupMessage, senderId: 'user_dave' }, groupConversation);
    assert.strictEqual(daveAllowed, false, 'Non-participant Dave cannot send to group');
  });

  it('13. Conversation document is created/updated with setDoc merge: true and participantIds', () => {
    assert.ok(
      chatServiceContent.includes("setDoc(doc(db, 'conversations', conversationId), convDocData, { merge: true })"),
      'Must use setDoc with merge: true to safely upsert conversation document'
    );
    assert.ok(
      chatServiceContent.includes('participantIds: participantIds'),
      'Conversation upsert must include participantIds for Firestore security rules'
    );
  });

  it('14. Direct conversation creation validates distinct valid targetUserId', () => {
    assert.ok(
      chatServiceContent.includes("!targetUserId || targetUserId === currentUserId"),
      'ChatService must prevent direct conversations with invalid or self targets'
    );
  });

  it('15. useChatThread resolves direct recipientId and surfaces errors via errorMessage', () => {
    const useChatThreadContent = fs.readFileSync(path.join(rootDir, 'src/features/inbox/hooks/useChatThread.ts'), 'utf8');
    assert.ok(
      useChatThreadContent.includes("conversation?.type === 'direct'"),
      'useChatThread must inspect direct conversation type'
    );
    assert.ok(
      useChatThreadContent.includes('recipientId,'),
      'useChatThread must pass resolved recipientId to service.sendMessage'
    );
    assert.ok(
      useChatThreadContent.includes("setErrorMessage(err?.message || 'Failed to send message')"),
      'useChatThread must surface send errors into errorMessage state'
    );
  });

  it('16. ChatThreadView visibly displays errorMessage banner on error', () => {
    const chatThreadViewContent = fs.readFileSync(path.join(rootDir, 'src/features/inbox/components/ChatThreadView.tsx'), 'utf8');
    assert.ok(
      chatThreadViewContent.includes('errorMessage,'),
      'ChatThreadView must destructure errorMessage'
    );
    assert.ok(
      chatThreadViewContent.includes('styles.errorBanner'),
      'ChatThreadView must render errorBanner when errorMessage is set'
    );
    assert.ok(
      chatThreadViewContent.includes('{errorMessage}'),
      'ChatThreadView must render the error message text'
    );
  });

  it('17. Direct message cannot bypass recipient validation by setting recipientId to null', () => {
    const directConversation = {
      id: 'conv_alice_bob',
      type: 'direct',
      participantIds: ['user_alice', 'user_bob']
    };
    // Alice maliciously attempts to send with recipientId: null into direct conversation
    const bypassAttempt = {
      id: 'msg_bypass_direct',
      conversationId: 'conv_alice_bob',
      senderId: 'user_alice',
      recipientId: null,
      participantIds: ['user_alice', 'user_bob'],
      text: 'Trying to bypass recipient check'
    };

    const allowed = evaluateMessageCreate('user_alice', bypassAttempt, directConversation);
    assert.strictEqual(allowed, false, 'Direct message setting recipientId to null must be REJECTED');
  });

  it('18. Orphan message with recipientId: null without conversation document is rejected', () => {
    const orphanAttempt = {
      id: 'msg_orphan',
      conversationId: 'conv_unknown',
      senderId: 'user_alice',
      recipientId: null,
      participantIds: ['user_alice'],
      text: 'Orphan message'
    };

    const allowed = evaluateMessageCreate('user_alice', orphanAttempt, null);
    assert.strictEqual(allowed, false, 'Message with null recipient without existing group doc must be REJECTED');
  });

  it('19. Direct message with sender as recipient is rejected', () => {
    const selfRecipientAttempt = {
      id: 'msg_self',
      conversationId: 'conv_alice_bob',
      senderId: 'user_alice',
      recipientId: 'user_alice',
      participantIds: ['user_alice', 'user_bob'],
      text: 'Self recipient'
    };

    const allowed = evaluateMessageCreate('user_alice', selfRecipientAttempt);
    assert.strictEqual(allowed, false, 'Direct message with recipientId equal to sender must be REJECTED');
  });

  it('20. firestore.rules explicitly validates direct recipients and restricts null recipientId to verified groups', () => {
    assert.ok(
      rulesContent.includes("data.type == 'group'"),
      'firestore.rules must require conversation type == group for null recipientId'
    );
    assert.ok(
      rulesContent.includes('request.resource.data.recipientId != request.auth.uid'),
      'firestore.rules must ensure direct recipient is not the sender'
    );
    assert.ok(
      rulesContent.includes('isNotBlocked(request.resource.data.recipientId)'),
      'firestore.rules must enforce isNotBlocked on direct recipient'
    );
  });

  // ── Serialization & Firestore lastMessage Safety Invariants ────────────────
  function deepCheckUndefined(obj) {
    if (obj === undefined) return true;
    if (obj !== null && typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        if (obj[key] === undefined) return true;
        if (deepCheckUndefined(obj[key])) return true;
      }
    }
    return false;
  }

  function sanitizeForFirestoreMirror(obj) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) continue;
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[key] = sanitizeForFirestoreMirror(value);
      } else if (Array.isArray(value)) {
        result[key] = value.filter(item => item !== undefined).map(item => item !== null && typeof item === 'object' && !(item instanceof Date) ? sanitizeForFirestoreMirror(item) : item);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  function buildFirestoreLastMessageSummaryMirror(message) {
    const summary = {
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
    if (message.recipientId !== undefined) {
      summary.recipientId = message.recipientId;
      summary.recipient_id = message.recipientId;
    }
    if (message.mediaUrl !== undefined) {
      summary.mediaUrl = message.mediaUrl;
      summary.media_url = message.mediaUrl;
    }
    if (message.mediaDuration !== undefined) {
      summary.mediaDuration = message.mediaDuration;
      summary.media_duration = message.mediaDuration;
    }
    if (message.replyTo !== undefined && message.replyTo !== null) {
      const replySummary = {
        messageId: message.replyTo.messageId,
        senderId: message.replyTo.senderId,
        senderName: message.replyTo.senderName || 'User',
        previewText: typeof message.replyTo.previewText === 'string' ? message.replyTo.previewText : '',
      };
      summary.replyTo = sanitizeForFirestoreMirror(replySummary);
    } else if (message.replyTo === null) {
      summary.replyTo = null;
    }
    return sanitizeForFirestoreMirror(summary);
  }

  it('21. Text-only message summary contains zero undefined fields and omits media fields', () => {
    const textMsg = {
      id: 'msg_text_1',
      conversationId: 'conv_1',
      senderId: 'user_alice',
      type: 'text',
      text: 'Hello world',
      deliveryStatus: 'sent',
      isRead: false,
      createdAt: '2026-10-09T12:00:00.000Z',
      mediaUrl: undefined,
      mediaDuration: undefined,
      replyTo: undefined,
      localId: 'local_1',
    };
    const summary = buildFirestoreLastMessageSummaryMirror(textMsg);
    assert.strictEqual(deepCheckUndefined(summary), false, 'Must contain zero undefined values');
    assert.strictEqual('mediaUrl' in summary, false, 'mediaUrl must be omitted when undefined');
    assert.strictEqual('mediaDuration' in summary, false, 'mediaDuration must be omitted when undefined');
    assert.strictEqual('replyTo' in summary, false, 'replyTo must be omitted when undefined');
    assert.strictEqual('localId' in summary, false, 'localId must not be serialized');
    assert.strictEqual(summary.text, 'Hello world');
    assert.strictEqual(summary.isRead, false);
  });

  it('22. Media message preserves valid mediaUrl and mediaDuration including numeric zero', () => {
    const mediaMsg = {
      id: 'msg_media_1',
      conversationId: 'conv_1',
      senderId: 'user_alice',
      type: 'video',
      text: '',
      deliveryStatus: 'sent',
      isRead: false,
      createdAt: '2026-10-09T12:00:00.000Z',
      mediaUrl: 'https://cdn.tiktalk.art/video.mp4',
      mediaDuration: 0,
    };
    const summary = buildFirestoreLastMessageSummaryMirror(mediaMsg);
    assert.strictEqual(deepCheckUndefined(summary), false, 'Must contain zero undefined values');
    assert.strictEqual(summary.mediaUrl, 'https://cdn.tiktalk.art/video.mp4');
    assert.strictEqual(summary.mediaDuration, 0, 'Numeric 0 must be preserved, not converted to null or undefined');
    assert.strictEqual(summary.text, '');
  });

  it('23. Message with optional reply fields preserves valid reply data and omits undefined', () => {
    const replyMsg = {
      id: 'msg_reply_1',
      conversationId: 'conv_1',
      senderId: 'user_alice',
      type: 'text',
      text: 'Replying to you',
      deliveryStatus: 'sent',
      isRead: false,
      createdAt: '2026-10-09T12:00:00.000Z',
      replyTo: {
        messageId: 'orig_1',
        senderId: 'user_bob',
        senderName: 'Bob Builds',
        previewText: 'Hello',
      },
    };
    const summary = buildFirestoreLastMessageSummaryMirror(replyMsg);
    assert.strictEqual(deepCheckUndefined(summary), false, 'Must contain zero undefined values');
    assert.strictEqual(summary.replyTo.messageId, 'orig_1');
    assert.strictEqual(summary.replyTo.senderName, 'Bob Builds');
    assert.strictEqual(summary.replyTo.previewText, 'Hello');
  });

  it('24. Legitimate null, false, and empty string are preserved in serialization', () => {
    const nullFieldsMsg = {
      id: 'msg_null_1',
      conversationId: 'conv_1',
      senderId: 'user_alice',
      recipientId: null,
      type: 'text',
      text: '',
      deliveryStatus: 'sent',
      isRead: false,
      createdAt: '2026-10-09T12:00:00.000Z',
      mediaUrl: null,
      mediaDuration: null,
      replyTo: null,
    };
    const summary = buildFirestoreLastMessageSummaryMirror(nullFieldsMsg);
    assert.strictEqual(deepCheckUndefined(summary), false, 'Must contain zero undefined values');
    assert.strictEqual(summary.recipientId, null, 'Explicit null recipientId must be preserved');
    assert.strictEqual(summary.mediaUrl, null, 'Explicit null mediaUrl must be preserved');
    assert.strictEqual(summary.mediaDuration, null, 'Explicit null mediaDuration must be preserved');
    assert.strictEqual(summary.replyTo, null, 'Explicit null replyTo must be preserved');
    assert.strictEqual(summary.isRead, false, 'Boolean false must be preserved');
    assert.strictEqual(summary.text, '', 'Empty string must be preserved');
  });

  it('25. ChatService source code builds lastMessage with buildFirestoreLastMessageSummary and sanitizeForFirestore', () => {
    const currentChatServiceContent = fs.readFileSync(path.join(rootDir, 'src/services/chat/ChatService.ts'), 'utf8');
    assert.ok(
      currentChatServiceContent.includes('buildFirestoreLastMessageSummary(finalizedMessage)'),
      'ChatService must build lastMessage summary with buildFirestoreLastMessageSummary'
    );
    assert.ok(
      currentChatServiceContent.includes('sanitizeForFirestore(rawConvDocData)'),
      'ChatService must sanitize convDocData with sanitizeForFirestore'
    );
    assert.ok(
      currentChatServiceContent.includes('sanitizeForFirestore(messageData)'),
      'ChatService must sanitize messageData with sanitizeForFirestore'
    );
  });

  it('26. Conversation upsert occurs before message write in ChatService source', () => {
    const currentChatServiceContent = fs.readFileSync(path.join(rootDir, 'src/services/chat/ChatService.ts'), 'utf8');
    const convUpsertIndex = currentChatServiceContent.indexOf("setDoc(doc(db, 'conversations', conversationId), convDocData, { merge: true })");
    const msgWriteIndex = currentChatServiceContent.indexOf("setDoc(msgDocRef, sanitizeForFirestore(messageData))");
    assert.ok(convUpsertIndex !== -1, 'Conversation upsert must exist');
    assert.ok(msgWriteIndex !== -1, 'Message write must exist');
    assert.ok(convUpsertIndex < msgWriteIndex, 'Conversation upsert must strictly precede message write');
  });

  it('27. Invalid payload produces immediate rejection and surfaces error to UI', () => {
    const currentChatServiceContent = fs.readFileSync(path.join(rootDir, 'src/services/chat/ChatService.ts'), 'utf8');
    assert.ok(
      currentChatServiceContent.includes('Invalid payload: message must include non-empty text or a mediaUrl'),
      'ChatService must reject empty text and missing mediaUrl'
    );
  });
});


