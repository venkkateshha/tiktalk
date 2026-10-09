/**
 * TikTalk: Real Firestore Security Rules Emulator Tests
 * 
 * Verifies real firestore.rules against the Firestore Emulator using
 * @firebase/rules-unit-testing and demo project ID demo-tiktalk-chat-rules.
 * Tests actual Firestore security rules AST execution under genuine SDK calls.
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const PROJECT_ID = 'demo-tiktalk-chat-rules';

describe('Real Firestore Security Rules Emulator Tests — Chat System', () => {
  let testEnv;
  const rootDir = process.cwd();
  const rules = fs.readFileSync(path.join(rootDir, 'firestore.rules'), 'utf8');

  before(async () => {
    const hostPort = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
    const [host, portStr] = hostPort.split(':');
    const port = parseInt(portStr, 10);

    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules,
        host,
        port,
      },
    });
  });

  after(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // REQUIRED POSITIVE CASES
  // ─────────────────────────────────────────────────────────────────────────────

  it('P1: Authenticated conversation participant can create a valid direct-message conversation', async () => {
    const aliceDb = testEnv.authenticatedContext('user_alice').firestore();
    const convData = {
      id: 'conv_alice_bob',
      type: 'direct',
      title: 'Bob Smith',
      participantIds: ['user_alice', 'user_bob'],
      participants: [
        { userId: 'user_alice', role: 'owner', joinedAt: new Date().toISOString() },
        { userId: 'user_bob', role: 'member', joinedAt: new Date().toISOString() },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await assertSucceeds(
      setDoc(doc(aliceDb, 'conversations', 'conv_alice_bob'), convData)
    );
  });

  it('P2: Valid direct-message write with correct sender, recipient, participantIds, and conversation succeeds', async () => {
    // Seed existing direct conversation in emulator
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, 'conversations', 'conv_alice_bob'), {
        id: 'conv_alice_bob',
        type: 'direct',
        participantIds: ['user_alice', 'user_bob'],
        updatedAt: new Date().toISOString(),
      });
    });

    const aliceDb = testEnv.authenticatedContext('user_alice').firestore();
    const messageData = {
      id: 'msg_direct_1',
      conversationId: 'conv_alice_bob',
      conversation_id: 'conv_alice_bob',
      senderId: 'user_alice',
      sender_id: 'user_alice',
      recipientId: 'user_bob',
      recipient_id: 'user_bob',
      participantIds: ['user_alice', 'user_bob'],
      participant_ids: ['user_alice', 'user_bob'],
      text: 'Hey Bob, how are you?',
      type: 'text',
      deliveryStatus: 'sent',
      delivery_status: 'sent',
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    await assertSucceeds(
      setDoc(doc(aliceDb, 'messages', 'msg_direct_1'), messageData)
    );
  });

  it('P3: Legitimate group conversation permits group message with canonical recipientId: null schema', async () => {
    // Seed group conversation in emulator
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, 'conversations', 'conv_group_designers'), {
        id: 'conv_group_designers',
        type: 'group',
        title: 'Designers Guild',
        participantIds: ['user_alice', 'user_bob', 'user_charlie'],
        updatedAt: new Date().toISOString(),
      });
    });

    const aliceDb = testEnv.authenticatedContext('user_alice').firestore();
    const groupMessageData = {
      id: 'msg_group_1',
      conversationId: 'conv_group_designers',
      conversation_id: 'conv_group_designers',
      senderId: 'user_alice',
      sender_id: 'user_alice',
      recipientId: null,
      recipient_id: null,
      participantIds: ['user_alice', 'user_bob', 'user_charlie'],
      participant_ids: ['user_alice', 'user_bob', 'user_charlie'],
      text: 'Hello design team!',
      type: 'text',
      deliveryStatus: 'sent',
      delivery_status: 'sent',
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    await assertSucceeds(
      setDoc(doc(aliceDb, 'messages', 'msg_group_1'), groupMessageData)
    );
  });

  it('P4: Authorized participants can read messages in their conversation', async () => {
    // Seed conversation and messages in emulator
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, 'conversations', 'conv_alice_bob'), {
        id: 'conv_alice_bob',
        type: 'direct',
        participantIds: ['user_alice', 'user_bob'],
      });
      await setDoc(doc(adminDb, 'messages', 'msg_direct_read_test'), {
        id: 'msg_direct_read_test',
        conversationId: 'conv_alice_bob',
        senderId: 'user_alice',
        recipientId: 'user_bob',
        participantIds: ['user_alice', 'user_bob'],
        text: 'Direct message for Bob',
      });
      await setDoc(doc(adminDb, 'conversations', 'conv_group_team'), {
        id: 'conv_group_team',
        type: 'group',
        participantIds: ['user_alice', 'user_bob', 'user_charlie'],
      });
      await setDoc(doc(adminDb, 'messages', 'msg_group_read_test'), {
        id: 'msg_group_read_test',
        conversationId: 'conv_group_team',
        senderId: 'user_alice',
        recipientId: null,
        participantIds: ['user_alice', 'user_bob', 'user_charlie'],
        text: 'Team update message',
      });
    });

    const bobDb = testEnv.authenticatedContext('user_bob').firestore();
    const charlieDb = testEnv.authenticatedContext('user_charlie').firestore();

    // Recipient Bob reads direct message
    const bobRead = await assertSucceeds(getDoc(doc(bobDb, 'messages', 'msg_direct_read_test')));
    assert.strictEqual(bobRead.exists(), true);

    // Group member Charlie reads group message
    const charlieRead = await assertSucceeds(getDoc(doc(charlieDb, 'messages', 'msg_group_read_test')));
    assert.strictEqual(charlieRead.exists(), true);
  });

  it('P5: Conversation creation followed by message creation works in actual ChatService order', async () => {
    const aliceDb = testEnv.authenticatedContext('user_alice').firestore();
    const convId = 'conv_order_flow';
    const msgId = 'msg_order_flow';
    const nowIso = new Date().toISOString();

    // 1. ChatService upserts conversation document first
    const convDocData = {
      id: convId,
      type: 'direct',
      participantIds: ['user_alice', 'user_bob'],
      participant_ids: ['user_alice', 'user_bob'],
      lastMessage: { id: msgId, text: 'First message', deliveryStatus: 'sent' },
      updatedAt: nowIso,
      updated_at: nowIso,
    };
    await assertSucceeds(
      setDoc(doc(aliceDb, 'conversations', convId), convDocData, { merge: true })
    );

    // 2. ChatService writes message document next
    const msgDocData = {
      id: msgId,
      conversationId: convId,
      conversation_id: convId,
      senderId: 'user_alice',
      sender_id: 'user_alice',
      recipientId: 'user_bob',
      recipient_id: 'user_bob',
      participantIds: ['user_alice', 'user_bob'],
      participant_ids: ['user_alice', 'user_bob'],
      text: 'First message in new thread',
      type: 'text',
      deliveryStatus: 'sent',
      delivery_status: 'sent',
      createdAt: nowIso,
      created_at: nowIso,
      updatedAt: nowIso,
      updated_at: nowIso,
    };
    await assertSucceeds(
      setDoc(doc(aliceDb, 'messages', msgId), msgDocData)
    );
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // REQUIRED NEGATIVE CASES
  // ─────────────────────────────────────────────────────────────────────────────

  it('N1: Unauthenticated user cannot send a message', async () => {
    const unauthDb = testEnv.unauthenticatedContext().firestore();
    const messageData = {
      id: 'msg_unauth',
      conversationId: 'conv_alice_bob',
      senderId: 'user_alice',
      recipientId: 'user_bob',
      participantIds: ['user_alice', 'user_bob'],
      text: 'Unauth attempt',
    };

    await assertFails(
      setDoc(doc(unauthDb, 'messages', 'msg_unauth'), messageData)
    );
  });

  it('N2: Forged sender identity is rejected', async () => {
    const aliceDb = testEnv.authenticatedContext('user_alice').firestore();
    // Alice maliciously claiming to be Bob
    const forgedMessage = {
      id: 'msg_forged',
      conversationId: 'conv_alice_bob',
      senderId: 'user_bob',
      sender_id: 'user_bob',
      recipientId: 'user_charlie',
      participantIds: ['user_bob', 'user_charlie'],
      text: 'Forged sender attempt',
    };

    await assertFails(
      setDoc(doc(aliceDb, 'messages', 'msg_forged'), forgedMessage)
    );
  });

  it('N3: Non-participant cannot create a message in someone else conversation', async () => {
    // Seed conversation between Alice and Bob
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, 'conversations', 'conv_alice_bob'), {
        id: 'conv_alice_bob',
        type: 'direct',
        participantIds: ['user_alice', 'user_bob'],
      });
    });

    const eveDb = testEnv.authenticatedContext('user_eve').firestore();
    // Eve (not in conversation) attempts to write to conv_alice_bob
    const injectedMessage = {
      id: 'msg_eve_injected',
      conversationId: 'conv_alice_bob',
      senderId: 'user_eve',
      recipientId: 'user_bob',
      participantIds: ['user_eve', 'user_bob'],
      text: 'Eve injecting into Alice and Bob chat',
    };

    await assertFails(
      setDoc(doc(eveDb, 'messages', 'msg_eve_injected'), injectedMessage)
    );
  });

  it('N4: Direct message with recipientId: null cannot bypass recipient validation', async () => {
    // Seed direct conversation between Alice and Bob
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, 'conversations', 'conv_direct_bypass'), {
        id: 'conv_direct_bypass',
        type: 'direct',
        participantIds: ['user_alice', 'user_bob'],
      });
    });

    const aliceDb = testEnv.authenticatedContext('user_alice').firestore();
    // Alice attempts to send with recipientId: null into direct conversation
    const bypassAttempt = {
      id: 'msg_bypass_attempt',
      conversationId: 'conv_direct_bypass',
      conversation_id: 'conv_direct_bypass',
      senderId: 'user_alice',
      sender_id: 'user_alice',
      recipientId: null,
      recipient_id: null,
      participantIds: ['user_alice', 'user_bob'],
      participant_ids: ['user_alice', 'user_bob'],
      text: 'Bypass recipient validation attempt',
    };

    await assertFails(
      setDoc(doc(aliceDb, 'messages', 'msg_bypass_attempt'), bypassAttempt)
    );
  });

  it('N5: Direct message with self recipient, blocked recipient, or unlisted recipient is rejected', async () => {
    // Seed block: Bob blocked Alice
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, 'conversations', 'conv_alice_bob'), {
        id: 'conv_alice_bob',
        type: 'direct',
        participantIds: ['user_alice', 'user_bob'],
      });
      // Target user (user_bob) + '_' + sender (user_alice)
      await setDoc(doc(adminDb, 'blocks', 'user_bob_user_alice'), {
        blockerId: 'user_bob',
        blockedId: 'user_alice',
        createdAt: new Date().toISOString(),
      });
    });

    const aliceDb = testEnv.authenticatedContext('user_alice').firestore();

    // 5a. Blocked recipient rejection
    const blockedMessage = {
      id: 'msg_to_blocker',
      conversationId: 'conv_alice_bob',
      senderId: 'user_alice',
      recipientId: 'user_bob',
      participantIds: ['user_alice', 'user_bob'],
      text: 'Message to user who blocked me',
    };
    await assertFails(
      setDoc(doc(aliceDb, 'messages', 'msg_to_blocker'), blockedMessage)
    );

    // 5b. Self-recipient rejection
    const selfMessage = {
      id: 'msg_self_recip',
      conversationId: 'conv_alice_bob',
      senderId: 'user_alice',
      recipientId: 'user_alice',
      participantIds: ['user_alice', 'user_bob'],
      text: 'Self recipient attempt',
    };
    await assertFails(
      setDoc(doc(aliceDb, 'messages', 'msg_self_recip'), selfMessage)
    );

    // 5c. Unlisted recipient (recipientId not in participantIds)
    const unlistedMessage = {
      id: 'msg_unlisted',
      conversationId: 'conv_alice_bob',
      senderId: 'user_alice',
      recipientId: 'user_dave',
      participantIds: ['user_alice', 'user_bob'],
      text: 'Dave is not in participantIds',
    };
    await assertFails(
      setDoc(doc(aliceDb, 'messages', 'msg_unlisted'), unlistedMessage)
    );
  });

  it('N6: Group message cannot use recipientId: null to bypass group membership validation', async () => {
    // Seed group conversation where members are Alice, Bob, Charlie (NOT Eve)
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, 'conversations', 'conv_group_secret'), {
        id: 'conv_group_secret',
        type: 'group',
        participantIds: ['user_alice', 'user_bob', 'user_charlie'],
      });
    });

    const eveDb = testEnv.authenticatedContext('user_eve').firestore();
    // Non-member Eve tries to send group message with recipientId: null
    const rogueGroupMessage = {
      id: 'msg_eve_group',
      conversationId: 'conv_group_secret',
      senderId: 'user_eve',
      recipientId: null,
      participantIds: ['user_alice', 'user_bob', 'user_charlie', 'user_eve'],
      text: 'Eve trying to message secret group',
    };

    await assertFails(
      setDoc(doc(eveDb, 'messages', 'msg_eve_group'), rogueGroupMessage)
    );
  });

  it('N7: Message referencing nonexistent conversation with recipientId: null is rejected', async () => {
    const aliceDb = testEnv.authenticatedContext('user_alice').firestore();
    // Conversation does not exist in /conversations
    const orphanGroupMessage = {
      id: 'msg_orphan_group',
      conversationId: 'conv_phantom_nonexistent',
      senderId: 'user_alice',
      recipientId: null,
      participantIds: ['user_alice', 'user_bob'],
      text: 'Orphan message with null recipient',
    };

    await assertFails(
      setDoc(doc(aliceDb, 'messages', 'msg_orphan_group'), orphanGroupMessage)
    );
  });

  it('N8: Outsider cannot read another conversation messages', async () => {
    // Seed conversations and messages
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, 'conversations', 'conv_private'), {
        id: 'conv_private',
        type: 'direct',
        participantIds: ['user_alice', 'user_bob'],
      });
      await setDoc(doc(adminDb, 'messages', 'msg_private_secret'), {
        id: 'msg_private_secret',
        conversationId: 'conv_private',
        senderId: 'user_alice',
        recipientId: 'user_bob',
        participantIds: ['user_alice', 'user_bob'],
        text: 'Top secret between Alice and Bob',
      });
    });

    const eveDb = testEnv.authenticatedContext('user_eve').firestore();
    await assertFails(
      getDoc(doc(eveDb, 'messages', 'msg_private_secret'))
    );
  });

  it('N9: Unauthorized changes to conversation participant membership are rejected', async () => {
    // Seed conversation between Alice and Bob
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, 'conversations', 'conv_alice_bob_members'), {
        id: 'conv_alice_bob_members',
        type: 'direct',
        participantIds: ['user_alice', 'user_bob'],
      });
    });

    const eveDb = testEnv.authenticatedContext('user_eve').firestore();
    // Outsider Eve attempts to inject herself into conversation participants
    await assertFails(
      updateDoc(doc(eveDb, 'conversations', 'conv_alice_bob_members'), {
        participantIds: ['user_alice', 'user_bob', 'user_eve'],
      })
    );
  });

  it('P10: Text-only message with no media fields creates conversation and message successfully in emulator', async () => {
    const aliceDb = testEnv.authenticatedContext('user_alice').firestore();
    const convData = {
      id: 'conv_alice_bob_text',
      type: 'direct',
      participantIds: ['user_alice', 'user_bob'],
      lastMessage: {
        id: 'msg_1',
        conversationId: 'conv_alice_bob_text',
        senderId: 'user_alice',
        type: 'text',
        text: 'Hello Bob',
        deliveryStatus: 'sent',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };

    await assertSucceeds(
      setDoc(doc(aliceDb, 'conversations', 'conv_alice_bob_text'), convData, { merge: true })
    );

    const messageData = {
      id: 'msg_1',
      conversationId: 'conv_alice_bob_text',
      conversation_id: 'conv_alice_bob_text',
      senderId: 'user_alice',
      sender_id: 'user_alice',
      recipientId: 'user_bob',
      recipient_id: 'user_bob',
      participantIds: ['user_alice', 'user_bob'],
      participant_ids: ['user_alice', 'user_bob'],
      type: 'text',
      text: 'Hello Bob',
      deliveryStatus: 'sent',
      createdAt: new Date().toISOString(),
    };

    await assertSucceeds(
      setDoc(doc(aliceDb, 'messages', 'msg_1'), messageData)
    );
  });

  it('P11: Media message with valid media fields and numeric zero mediaDuration succeeds in emulator', async () => {
    const aliceDb = testEnv.authenticatedContext('user_alice').firestore();
    const convData = {
      id: 'conv_alice_bob_media',
      type: 'direct',
      participantIds: ['user_alice', 'user_bob'],
      lastMessage: {
        id: 'msg_2',
        conversationId: 'conv_alice_bob_media',
        senderId: 'user_alice',
        type: 'video',
        text: '',
        mediaUrl: 'https://cdn.tiktalk.art/vid.mp4',
        mediaDuration: 0,
        deliveryStatus: 'sent',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };

    await assertSucceeds(
      setDoc(doc(aliceDb, 'conversations', 'conv_alice_bob_media'), convData, { merge: true })
    );
  });

  it('N10: Writing conversation with unsupported undefined property is rejected by Firestore client SDK', async () => {
    const aliceDb = testEnv.authenticatedContext('user_alice').firestore();
    const invalidConvData = {
      id: 'conv_invalid',
      type: 'direct',
      participantIds: ['user_alice', 'user_bob'],
      lastMessage: {
        id: 'msg_invalid',
        mediaUrl: undefined,
      },
    };

    assert.throws(
      () => {
        setDoc(doc(aliceDb, 'conversations', 'conv_invalid'), invalidConvData);
      },
      (err) => err?.message?.includes('Unsupported field value: undefined') || err?.code === 'invalid-argument'
    );
  });
});
