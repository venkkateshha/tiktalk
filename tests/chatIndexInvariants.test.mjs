import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Chat Firestore Composite Index & Query Reliability Invariants', () => {
  const rootDir = process.cwd();
  const chatServiceContent = fs.readFileSync(path.join(rootDir, 'src/services/chat/ChatService.ts'), 'utf8');
  const indexContent = fs.readFileSync(path.join(rootDir, 'firestore.indexes.json'), 'utf8');
  const indexJson = JSON.parse(indexContent);

  it('1. ChatService getConversations queries with participantIds array-contains and updatedAt desc', () => {
    assert.ok(
      chatServiceContent.includes("where('participantIds', 'array-contains', currentUserId)"),
      'ChatService must filter by participantIds array-contains currentUserId'
    );
    assert.ok(
      chatServiceContent.includes("orderBy('updatedAt', 'desc')"),
      'ChatService must order by updatedAt desc'
    );
    assert.ok(
      chatServiceContent.includes('firestoreLimit(50)'),
      'ChatService must limit query results'
    );
  });

  it('2. firestore.indexes.json contains required composite index for conversations (participantIds CONTAINS + updatedAt DESCENDING)', () => {
    const matchingIndex = indexJson.indexes.find((idx) => {
      if (idx.collectionGroup !== 'conversations') return false;
      const fields = idx.fields;
      if (!Array.isArray(fields) || fields.length !== 2) return false;
      const f1 = fields[0];
      const f2 = fields[1];
      return (
        f1.fieldPath === 'participantIds' &&
        f1.arrayConfig === 'CONTAINS' &&
        f2.fieldPath === 'updatedAt' &&
        f2.order === 'DESCENDING'
      );
    });

    assert.ok(
      matchingIndex,
      'firestore.indexes.json must contain composite index for conversations: participantIds (CONTAINS) + updatedAt (DESCENDING)'
    );
  });

  it('3. firestore.indexes.json also indexes updated_at snake_case variant for cross-schema compatibility', () => {
    const matchingSnakeIndex = indexJson.indexes.find((idx) => {
      if (idx.collectionGroup !== 'conversations') return false;
      const fields = idx.fields;
      if (!Array.isArray(fields) || fields.length !== 2) return false;
      return (
        fields[0].fieldPath === 'participantIds' &&
        fields[0].arrayConfig === 'CONTAINS' &&
        fields[1].fieldPath === 'updated_at' &&
        fields[1].order === 'DESCENDING'
      );
    });

    assert.ok(
      matchingSnakeIndex,
      'firestore.indexes.json must support updated_at DESCENDING alongside updatedAt'
    );
  });

  it('4. Real empty Firestore response returns empty array and does NOT silently load stored mock data', () => {
    assert.ok(
      chatServiceContent.includes('// Real Firestore result is empty; do NOT mask as mock stored conversations\n          conversations = [];'),
      'When Firestore returns empty result, it must return empty list instead of falling back to stored mock data'
    );
    assert.ok(
      !chatServiceContent.includes('else {\n            conversations = await this.getStoredConversations();\n          }'),
      'Must NOT fall back to getStoredConversations on snap.empty'
    );
  });

  it('5. Handles failed-precondition with transparent client-sorted query fallback without masking failures', () => {
    assert.ok(
      chatServiceContent.includes("if (queryErr?.code === 'failed-precondition')"),
      'ChatService must catch failed-precondition explicitly'
    );
    assert.ok(
      chatServiceContent.includes(
        "console.warn(\n              '[ChatService] Firestore getConversations missing composite index"
      ),
      'Must log warning when composite index is missing or building'
    );
    assert.ok(
      chatServiceContent.includes("else if (queryErr?.code === 'permission-denied')"),
      'Must handle permission-denied explicitly'
    );
    assert.ok(
      chatServiceContent.includes('throw queryErr;'),
      'Must rethrow unexpected Firestore query errors instead of silently masking with local mock data'
    );
  });
});
