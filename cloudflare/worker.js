/**
 * TikTalk Cloudflare R2 Media Edge Worker
 *
 * Capabilities:
 *  1. Direct Binary Streaming Upload (Videos, Thumbnails, Avatars, Stories)
 *  2. Byte-Range Media Streaming (HTTP 206 Partial Content for smooth video seeking)
 *  3. Global Edge Caching (Cache-Control headers for ultra-fast CDN delivery)
 *  4. Secure CORS Headers (Supports Web, iOS & Android clients)
 *  5. Zero Egress Bandwidth Fees
 *  6. Protected Story media (/story-media/{storyId}/{file}); raw /stories/* is always 403
 */

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function jsonResponse(body, status, corsHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

function b64urlToBytes(s) {
  let b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

function bytesToB64url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function strToB64url(str) {
  return bytesToB64url(new TextEncoder().encode(str));
}

// Convert a PEM string (any BEGIN/END header) to an ArrayBuffer
function pemToArrayBuffer(pem) {
  const b64 = pem.replace(/-----(BEGIN|END)[A-Z ]+-----/g, '').replace(/\s+/g, '');
  const binary = atob(b64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    arr[i] = binary.charCodeAt(i);
  }
  return arr.buffer;
}

function getServiceAccountSecrets(env) {
  if (env && env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const sa = typeof env.FIREBASE_SERVICE_ACCOUNT === 'string'
        ? JSON.parse(env.FIREBASE_SERVICE_ACCOUNT)
        : env.FIREBASE_SERVICE_ACCOUNT;
      if (sa && typeof sa === 'object') {
        return {
          clientEmail: sa.client_email || env.FIREBASE_CLIENT_EMAIL,
          rawKey: sa.private_key || env.FIREBASE_PRIVATE_KEY,
          projectId: sa.project_id || env.FIREBASE_PROJECT_ID,
        };
      }
    } catch {
      // malformed JSON string, fall through to separate env vars
    }
  }
  return {
    clientEmail: env?.FIREBASE_CLIENT_EMAIL,
    rawKey: env?.FIREBASE_PRIVATE_KEY,
    projectId: env?.FIREBASE_PROJECT_ID,
  };
}

let cachedAccessToken = null;
let tokenExpiry = 0; // epoch ms

async function getAccessToken(env) {
  const now = Date.now();
  if (cachedAccessToken && now < tokenExpiry - 60000) {
    return cachedAccessToken;
  }
  const { clientEmail, rawKey } = getServiceAccountSecrets(env);
  if (!clientEmail || !rawKey) {
    throw new Error('Firebase service account secrets are not configured');
  }
  const privateKey = rawKey.replace(/\\n/g, '\n');
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const iat = Math.floor(now / 1000);
  const jwtHeader = { alg: 'RS256', typ: 'JWT' };
  const jwtPayload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: tokenUrl,
    iat,
    exp: iat + 3600,
    scope: 'https://www.googleapis.com/auth/datastore',
  };
  const unsigned = `${strToB64url(JSON.stringify(jwtHeader))}.${strToB64url(JSON.stringify(jwtPayload))}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    key,
    new TextEncoder().encode(unsigned)
  );
  const signedJwt = `${unsigned}.${bytesToB64url(new Uint8Array(signature))}`;
  const resp = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signedJwt,
    }).toString(),
  });
  if (!resp.ok) throw new Error('Failed to obtain access token');
  const data = await resp.json();
  if (!data.access_token) throw new Error('Access token missing in OAuth response');
  cachedAccessToken = data.access_token;
  tokenExpiry = now + (Number(data.expires_in) || 3600) * 1000;
  return cachedAccessToken;
}

async function fetchFirestoreDoc(path, env) {
  const token = await getAccessToken(env);
  const { projectId } = getServiceAccountSecrets(env);
  if (!projectId) throw new Error('FIREBASE_PROJECT_ID not configured');
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`;
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (resp.status === 404) return null;
  if (!resp.ok) throw new Error(`Firestore request failed: ${resp.status}`);
  return await resp.json();
}

async function fetchFirestoreStory(storyId, env) {
  const doc = await fetchFirestoreDoc(`stories/${encodeURIComponent(storyId)}`, env);
  if (!doc || !doc.fields) throw new Error('Story not found');
  return doc;
}

// Follow doc id convention: follows/{followerId}_{followingId}, status == 'active'
async function isFollower(uid, creatorId, env) {
  const doc = await fetchFirestoreDoc(
    `follows/${encodeURIComponent(`${uid}_${creatorId}`)}`,
    env
  );
  if (!doc || !doc.fields) return false;
  return doc.fields.status?.stringValue === 'active';
}

// Returns true only on explicit permission. Throws on lookup failure (caller denies).
async function userCanAccessStory(storyDoc, uid, env) {
  if (!uid) return false;
  const fields = storyDoc.fields || {};
  const creatorId = fields.creatorId?.stringValue;
  if (!creatorId) return false;
  if (creatorId === uid) return true;

  const hidden = (fields.hiddenFromUserIds?.arrayValue?.values || []).map((v) => v.stringValue);
  if (hidden.includes(uid)) return false;

  const audience = fields.audience?.stringValue;
  if (audience === 'everyone' || audience === 'public') return true;
  if (audience === 'followers') return await isFollower(uid, creatorId, env);
  if (audience === 'custom') {
    const allowed = (fields.customAllowedUserIds?.arrayValue?.values || []).map((v) => v.stringValue);
    return allowed.includes(uid);
  }
  return false;
}

// -----------------------------------------------------------------------------
// Firebase ID token verification (signature + claims)
// -----------------------------------------------------------------------------
async function verifyFirebaseIdToken(idToken, env) {
  const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
  const cacheKey = 'firebase-public-keys';
  const cached = globalThis[cacheKey];
  let keys;
  if (cached && cached.expires > Date.now()) {
    keys = cached.keys;
  } else {
    const resp = await fetch(JWKS_URL);
    if (!resp.ok) throw new Error('Failed to fetch Firebase public keys');
    const body = await resp.json();
    keys = body.keys || [];
    globalThis[cacheKey] = { keys, expires: Date.now() + 60 * 60 * 1000 };
  }
  const parts = idToken.split('.');
  if (parts.length !== 3) throw new Error('Invalid ID token format');
  const [headerB64, payloadB64, signatureB64] = parts;
  if (!headerB64 || !payloadB64 || !signatureB64) throw new Error('Invalid ID token format');
  const headerJson = JSON.parse(new TextDecoder().decode(b64urlToBytes(headerB64)));
  // Verify token algorithm is RS256 as required by Firebase
  if (headerJson.alg !== 'RS256') {
    throw new Error('Firebase ID token algorithm mismatch: expected RS256');
  }
  const jwk = keys.find((k) => k.kid === headerJson.kid);
  if (!jwk) throw new Error('Unknown key ID in Firebase token');
  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: { name: 'SHA-256' } },
    false,
    ['verify']
  );
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = b64urlToBytes(signatureB64);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, signature, data);
  if (!valid) throw new Error('Invalid Firebase ID token signature');
  const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(payloadB64)));
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
    throw new Error('Firebase ID token exp claim invalid');
  }
  // Validate expiration
  if (payload.exp < now) throw new Error('Firebase ID token expired');
  // Validate issued-at is present and not in the future
  if (typeof payload.iat !== 'number' || payload.iat > now) {
    throw new Error('Firebase ID token iat claim invalid');
  }
  // Validate auth_time is present and not in the future
  if (typeof payload.auth_time !== 'number' || payload.auth_time > now) {
    throw new Error('Firebase ID token auth_time claim invalid');
  }
  // Validate subject (sub) exists
  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new Error('Firebase ID token sub claim invalid');
  }
  const { projectId } = getServiceAccountSecrets(env);
  if (!projectId) throw new Error('FIREBASE_PROJECT_ID not configured');
  if (payload.aud !== projectId) throw new Error('Firebase ID token audience mismatch');
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('Firebase ID token issuer mismatch');
  return payload.sub;
}

function parseRange(rangeHeader) {
  if (!rangeHeader) return undefined;
  const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
  if (!match) return undefined;
  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : undefined;
  return { range: end !== undefined ? { offset: start, length: end - start + 1 } : { offset: start } };
}

// -----------------------------------------------------------------------------
// Scheduled cleanup of expired Story media (storage cleanup ONLY — not an auth boundary)
// -----------------------------------------------------------------------------
const STORY_PREFIX = 'stories/';
// Cleanup safety margin: Story documents are created after upload (up to STORY_MAX_PUBLISH_GAP_MS = 30m).
// Story.expiresAt = Story.createdAt + 24h <= uploadedAt + 24h + 30m.
// A 60-minute safety margin guarantees R2 cleanup NEVER deletes media before the Story's authoritative expiration.
export const STORY_CLEANUP_SAFETY_MARGIN_MS = 60 * 60 * 1000;
const LIST_PAGE_SIZE = 1000;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/;

// Returns epoch ms of the Worker-written `expiresAt` metadata, or null if missing/malformed.
function parseTrustedExpiry(customMetadata) {
  const raw = customMetadata && customMetadata.expiresAt;
  if (typeof raw !== 'string' || !ISO_RE.test(raw)) return null;
  const ms = new Date(raw).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Deletes expired objects under `stories/` using ONLY trusted R2 object metadata.
 * Rule: expiresAt + safetyMarginMs <= nowMs => delete. Missing/malformed metadata => preserve.
 * `expiresAt` metadata = upload time + 24h (Worker-generated). The Story document's own expiry is
 * createdAt + 24h, where createdAt is AFTER the upload. The safety margin guarantees media outlives the
 * Story as long as the Story is created within STORY_MAX_PUBLISH_GAP_MS of the upload (enforced client-side
 * from the Worker-generated key timestamp).
 * Per-object errors are isolated; a list failure stops the run without deleting anything further.
 */
export async function cleanupExpiredStories(
  env,
  nowMs = Date.now(),
  log = console,
  safetyMarginMs = STORY_CLEANUP_SAFETY_MARGIN_MS
) {
  const stats = { pages: 0, inspected: 0, deleted: 0, preserved: 0, skipped: 0, deleteFailures: 0, listFailed: false };
  log.log(`[story-cleanup] start now=${new Date(nowMs).toISOString()}`);
  let cursor;
  do {
    let page;
    try {
      page = await env.MEDIA_BUCKET.list({
        prefix: STORY_PREFIX,
        limit: LIST_PAGE_SIZE,
        cursor,
        include: ['customMetadata'],
      });
    } catch (e) {
      stats.listFailed = true;
      log.error(`[story-cleanup] list failed (stopping run): ${e && e.message ? e.message : 'unknown'}`);
      break;
    }
    stats.pages++;
    for (const obj of page.objects || []) {
      stats.inspected++;
      const key = obj && obj.key;
      if (typeof key !== 'string' || key.length <= STORY_PREFIX.length || !key.startsWith(STORY_PREFIX)) {
        stats.skipped++; // never touch anything outside stories/
        continue;
      }
      const expiresMs = parseTrustedExpiry(obj.customMetadata);
      if (expiresMs === null) {
        stats.skipped++;
        log.warn(`[story-cleanup] preserved (missing/malformed expiresAt): ${key}`);
        continue;
      }
      if (expiresMs + safetyMarginMs <= nowMs) {
        try {
          await env.MEDIA_BUCKET.delete(key);
          stats.deleted++;
        } catch (e) {
          stats.deleteFailures++;
          log.error(`[story-cleanup] delete failed: ${key}: ${e && e.message ? e.message : 'unknown'}`);
        }
      } else {
        stats.preserved++;
      }
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  log.log(`[story-cleanup] done ${JSON.stringify(stats)}`);
  return stats;
}

// -----------------------------------------------------------------------------
// CORS Security & Trusted Origin Policy
// -----------------------------------------------------------------------------
export const DEFAULT_TRUSTED_ORIGINS = new Set([
  'https://tiktalk.art',
  'https://www.tiktalk.art',
  'https://admin.tiktalk.art',
]);

export function normalizeOrigin(origin) {
  if (!origin || typeof origin !== 'string') return '';
  const trimmed = origin.trim();
  const lower = trimmed.toLowerCase();
  if (lower === '' || lower === 'null' || lower === '*' || lower === 'undefined') {
    return '';
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.origin === 'null' || !parsed.protocol.startsWith('http')) {
      return '';
    }
    return parsed.origin;
  } catch {
    return trimmed.replace(/\/+$/, '');
  }
}

export function getTrustedOrigins(env) {
  const trusted = new Set(DEFAULT_TRUSTED_ORIGINS);

  const envOrigins = [env?.ALLOWED_ORIGINS, env?.ALLOWED_ORIGIN];
  for (const raw of envOrigins) {
    if (typeof raw === 'string') {
      const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
      for (const part of parts) {
        if (part !== '*' && part.toLowerCase() !== 'null' && part.toLowerCase() !== 'undefined') {
          const norm = normalizeOrigin(part);
          if (norm && norm.toLowerCase() !== 'null') {
            trusted.add(norm);
          }
        }
      }
    }
  }

  // Defensively ensure invalid, empty, wildcard, or null origins can NEVER be trusted
  trusted.delete('');
  trusted.delete('null');
  trusted.delete('*');

  return trusted;
}

export function buildCorsHeaders(request, env) {
  const requestOrigin = request.headers.get('Origin');
  const headers = {
    'Vary': 'Origin',
  };

  if (!requestOrigin) {
    return headers;
  }

  const trimmed = requestOrigin.trim();
  const lower = trimmed.toLowerCase();
  if (lower === '' || lower === 'null' || lower === 'undefined') {
    return headers;
  }

  const normalized = normalizeOrigin(trimmed);
  if (!normalized || normalized.toLowerCase() === 'null') {
    return headers;
  }

  const trustedOrigins = getTrustedOrigins(env);

  if (trustedOrigins.has(normalized)) {
    headers['Access-Control-Allow-Origin'] = normalized;
    headers['Access-Control-Allow-Methods'] = 'GET, HEAD, POST, DELETE, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Range, X-Requested-With';
    headers['Access-Control-Expose-Headers'] = 'Content-Range, Content-Length, Accept-Ranges, ETag';
    headers['Access-Control-Max-Age'] = '86400';
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

// -----------------------------------------------------------------------------
// Worker entry
// -----------------------------------------------------------------------------
export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(cleanupExpiredStories(env, Date.now()));
  },

  async fetch(request, env) {
    const corsHeaders = buildCorsHeaders(request, env);

    // 1. Handle Preflight CORS Requests
    if (request.method === 'OPTIONS') {
      const requestOrigin = request.headers.get('Origin');
      if (requestOrigin) {
        const trimmed = requestOrigin.trim();
        const normalized = normalizeOrigin(trimmed);
        const trustedOrigins = getTrustedOrigins(env);
        if (!normalized || trimmed.toLowerCase() === 'null' || !trustedOrigins.has(normalized)) {
          return new Response(JSON.stringify({ error: 'CORS origin not allowed' }), {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              'Vary': 'Origin',
            },
          });
        }
      }
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      // 2. HEALTH CHECK ENDPOINT
      if (pathname === '/' || pathname === '/health') {
        return jsonResponse(
          {
            status: 'online',
            service: 'TikTalk Cloudflare R2 Edge',
            region: request.cf?.colo || 'edge',
            timestamp: new Date().toISOString(),
          },
          200,
          corsHeaders
        );
      }

      // Raw story objects are NEVER served directly (any method, any Range) and never read from R2.
      if (pathname.startsWith('/stories/')) {
        return jsonResponse({ error: 'Forbidden' }, 403, corsHeaders);
      }

      // Firebase ID token verification (no static secret). Computed only for non-public routes.
      const needsAuth =
        request.method === 'POST' ||
        request.method === 'DELETE' ||
        pathname.startsWith('/story-media/');
      let uid = null;
      if (needsAuth) {
        const authHeader = request.headers.get('Authorization') || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        try {
          uid = token ? await verifyFirebaseIdToken(token, env) : null;
        } catch (e) {
          uid = null; // Invalid token
        }
      }
      const isAuthorized = !!uid;

      // 3. MEDIA UPLOAD ENDPOINT (POST /upload/:type) – secured
      if (request.method === 'POST' && pathname.startsWith('/upload/')) {
        if (!isAuthorized) {
          return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
        }
        const type = pathname.replace('/upload/', '');
        const validTypes = ['video', 'avatar', 'thumbnail', 'story'];
        if (!validTypes.includes(type)) {
          return jsonResponse(
            { error: `Invalid upload type. Must be one of: ${validTypes.join(', ')}` },
            400,
            corsHeaders
          );
        }

        const contentType = request.headers.get('content-type') || (type === 'video' || type === 'story' ? 'video/mp4' : 'image/jpeg');
        const extension = contentType.includes('webm') ? 'webm' : contentType.includes('png') ? 'png' : contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'mp4';
        const uniqueId = `${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
        let key;
        if (type === 'story') {
          key = `stories/${uniqueId}.${extension}`;
        } else {
          key = `${type}s/${uniqueId}.${extension}`;
        }
        const uploadedAt = new Date().toISOString();
        const isStory = type === 'story';
        const expiresAt = isStory
          ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          : '';

        // Stream body directly into R2 bucket. Security metadata is server-generated only.
        await env.MEDIA_BUCKET.put(key, request.body, {
          httpMetadata: {
            contentType,
            cacheControl: isStory ? 'private, max-age=0, no-store' : 'public, max-age=31536000, immutable',
          },
          customMetadata: {
            uploadedAt,
            clientIp: request.headers.get('cf-connecting-ip') || 'unknown',
            uploaderUid: uid,
            ...(isStory ? { expiresAt } : {}),
          },
        });

        const cdnDomain = env.PUBLIC_CDN_URL?.replace(/\/$/, '') || url.origin;
        const publicUrl = `${cdnDomain}/${key}`;

        return jsonResponse(
          {
            success: true,
            key,
            publicUrl,
            contentType,
            uploadedAt,
            ...(isStory ? { expiresAt } : {}),
          },
          201,
          corsHeaders
        );
      }

      // 4. PROTECTED STORY MEDIA: /story-media/{storyId}/{file}
      const storyMediaMatch = pathname.match(/^\/story-media\/([^\/]+)\/([^\/]+)$/);
      if (storyMediaMatch) {
        if (request.method !== 'GET' && request.method !== 'HEAD') {
          return jsonResponse({ error: 'Method Not Allowed' }, 405, corsHeaders);
        }
        if (!isAuthorized) {
          return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
        }
        const storyId = decodeURIComponent(storyMediaMatch[1]);
        const fileName = decodeURIComponent(storyMediaMatch[2]);

        // Fail closed: any lookup failure denies access.
        let storyDoc;
        let allowed = false;
        try {
          storyDoc = await fetchFirestoreStory(storyId, env);
          allowed = await userCanAccessStory(storyDoc, uid, env);
        } catch (e) {
          return jsonResponse({ error: 'Forbidden' }, 403, corsHeaders);
        }
        if (!allowed) {
          return jsonResponse({ error: 'Forbidden' }, 403, corsHeaders);
        }

        const expiresAt = storyDoc.fields?.expiresAt?.timestampValue;
        const expiresMs = expiresAt ? new Date(expiresAt).getTime() : NaN;
        if (!Number.isFinite(expiresMs) || expiresMs <= Date.now()) {
          return jsonResponse({ error: 'Story Expired' }, 403, corsHeaders);
        }

        const mediaKey = storyDoc.fields?.mediaKey?.stringValue;
        if (!mediaKey || !mediaKey.startsWith('stories/') || mediaKey.includes('..')) {
          return jsonResponse({ error: 'Forbidden' }, 403, corsHeaders);
        }
        const expectedFile = mediaKey.split('/').pop();
        if (expectedFile !== fileName) {
          return jsonResponse({ error: 'Forbidden' }, 403, corsHeaders);
        }

        // Authorization complete — only now touch R2
        const rangeHeader = request.headers.get('Range');
        const options = parseRange(rangeHeader);
        const object = await env.MEDIA_BUCKET.get(mediaKey, options);
        if (!object) {
          return new Response('Media Not Found', { status: 404, headers: corsHeaders });
        }
        // Bind media to its uploader: a Story may only reference media uploaded by its creator.
        // (Legacy objects without uploaderUid metadata are not blocked by this check.)
        const uploaderUid = object.customMetadata && object.customMetadata.uploaderUid;
        const creatorId = storyDoc.fields?.creatorId?.stringValue;
        if (typeof uploaderUid === 'string' && uploaderUid !== '' && uploaderUid !== creatorId) {
          return jsonResponse({ error: 'Forbidden' }, 403, corsHeaders);
        }
        const headers = new Headers(corsHeaders);
        object.writeHttpMetadata(headers);
        if (corsHeaders['Vary']) headers.set('Vary', corsHeaders['Vary']);
        headers.set('etag', object.httpEtag);
        headers.set('Accept-Ranges', 'bytes');
        headers.set('Cache-Control', 'private, max-age=0, no-store');
        if (rangeHeader && object.range) {
          headers.set('Content-Range', `bytes ${object.range.offset}-${object.range.offset + (object.range.length || object.size) - 1}/${object.size}`);
          return new Response(request.method === 'HEAD' ? null : object.body, { status: 206, headers });
        }
        return new Response(request.method === 'HEAD' ? null : object.body, { status: 200, headers });
      }

      // 5. MEDIA DELETION (DELETE /media/:key) – secured and ownership enforced
      if (request.method === 'DELETE' && pathname.startsWith('/media/')) {
        if (!isAuthorized) {
          return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
        }
        const key = decodeURIComponent(pathname.replace('/media/', ''));
        // Verify ownership via R2 metadata
        const objHead = await env.MEDIA_BUCKET.head(key);
        if (!objHead) {
          return jsonResponse({ error: 'Object not found' }, 404, corsHeaders);
        }
        const ownerUid = objHead.customMetadata?.uploaderUid;
        if (!ownerUid || ownerUid !== uid) {
          return jsonResponse({ error: 'Forbidden: object does not belong to user' }, 403, corsHeaders);
        }
        await env.MEDIA_BUCKET.delete(key);
        return jsonResponse({ success: true, deletedKey: key }, 200, corsHeaders);
      }

      // 6. PUBLIC MEDIA (avatars/videos/thumbnails) WITH BYTE-RANGE SUPPORT
      if (request.method === 'GET' || request.method === 'HEAD') {
        const key = pathname.replace(/^\//, '');
        if (!key) {
          return new Response('Not Found', { status: 404, headers: corsHeaders });
        }
        const rangeHeader = request.headers.get('Range');
        const options = parseRange(rangeHeader);
        const object = await env.MEDIA_BUCKET.get(key, options);
        if (!object) {
          return new Response('Media Not Found', { status: 404, headers: corsHeaders });
        }
        const headers = new Headers(corsHeaders);
        object.writeHttpMetadata(headers);
        if (corsHeaders['Vary']) headers.set('Vary', corsHeaders['Vary']);
        headers.set('etag', object.httpEtag);
        headers.set('Accept-Ranges', 'bytes');
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        if (rangeHeader && object.range) {
          headers.set('Content-Range', `bytes ${object.range.offset}-${object.range.offset + (object.range.length || object.size) - 1}/${object.size}`);
          return new Response(request.method === 'HEAD' ? null : object.body, { status: 206, headers });
        }
        return new Response(request.method === 'HEAD' ? null : object.body, { status: 200, headers });
      }

      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    } catch (err) {
      const safeMessage = err?.message && !/key|secret|token|bearer|private/i.test(err.message)
        ? err.message
        : 'Internal Cloudflare R2 Worker Error';
      return jsonResponse(
        { error: safeMessage },
        500,
        corsHeaders
      );
    }
  },
};
