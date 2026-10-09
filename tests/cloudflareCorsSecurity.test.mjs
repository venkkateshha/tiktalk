/**
 * TikTalk Problem 13 Targeted Test:
 * Cloudflare Worker CORS Security Hardening
 *
 * Verifies:
 * 1. Production defaults do not trust localhost or 127.0.0.1
 * 2. The Worker resource-host URL is not trusted solely because it is the resource host
 * 3. Verified production web origins remain allowed with expected CORS headers
 * 4. Explicit local development configuration can allow required local origins without leaking them into production
 * 5. Arbitrary origins are never reflected
 * 6. OPTIONS preflights allow only intended methods and headers, rejecting untrusted origins
 * 7. Requests without Origin (e.g. native mobile apps, CLI, internal jobs) operate safely subject to existing authentication
 * 8. Credential-related headers are never combined with wildcard (*) origins
 * 9. Existing authentication, authorization, and media protection invariants remain intact
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { generateKeyPairSync, createSign } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workerFilePath = path.join(root, 'cloudflare/worker.js');
const wranglerFilePath = path.join(root, 'cloudflare/wrangler.toml');

// Import the worker dynamically
const tmpWorker = path.join(os.tmpdir(), `worker_cors_test_${process.pid}_${Date.now()}.mjs`);
fs.copyFileSync(workerFilePath, tmpWorker);
const mod = await import(pathToFileURL(tmpWorker).href);
try { fs.unlinkSync(tmpWorker); } catch {}
const worker = mod.default;
const { DEFAULT_TRUSTED_ORIGINS, getTrustedOrigins } = mod;

// Setup test mocks and environment
const PROJECT = 'tiktalk-test-proj';
const fb = generateKeyPairSync('rsa', { modulusLength: 2048 });
const sa = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...fb.publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256', use: 'sig' };
const saPem = sa.privateKey.export({ type: 'pkcs8', format: 'pem' });

const b64u = (b) => Buffer.from(b).toString('base64url');
function mkToken(uid, over = {}) {
  const now = Math.floor(Date.now() / 1000);
  const h = b64u(JSON.stringify({ alg: 'RS256', kid: 'k1', typ: 'JWT' }));
  const p = b64u(JSON.stringify({
    iss: `https://securetoken.google.com/${PROJECT}`,
    aud: PROJECT,
    sub: uid,
    iat: now - 5,
    auth_time: now - 5,
    exp: now + 3600,
    ...over,
  }));
  const s = createSign('RSA-SHA256').update(`${h}.${p}`).sign(fb.privateKey);
  return `${h}.${p}.${b64u(s)}`;
}

// Default production mock environment
const mockEnv = {
  FIREBASE_PROJECT_ID: PROJECT,
  FIREBASE_CLIENT_EMAIL: 'sa@test',
  FIREBASE_PRIVATE_KEY: saPem.replace(/\n/g, '\\n'),
  PUBLIC_CDN_URL: 'https://tiktalk-media-edge.tiktalk67725.workers.dev',
  MEDIA_BUCKET: {
    async get(key, opts) {
      return {
        body: 'video-data',
        httpEtag: 'test-etag',
        size: 10,
        range: opts?.range,
        writeHttpMetadata() {},
        customMetadata: { uploaderUid: 'creator1' },
      };
    },
    async put() {},
    async head(k) {
      return { customMetadata: { uploaderUid: 'creator1' } };
    },
    async delete() {},
  },
};

describe('Problem 13 — Cloudflare Worker CORS Security Hardening', () => {

  describe('1. Static Configuration Verification', () => {
    it('wrangler.toml does not configure ALLOWED_ORIGIN as wildcard (*)', () => {
      const wranglerContent = fs.readFileSync(wranglerFilePath, 'utf8');
      assert.strictEqual(
        /ALLOWED_ORIGIN\s*=\s*"\*"/.test(wranglerContent),
        false,
        'wrangler.toml must not set ALLOWED_ORIGIN = "*"'
      );
    });

    it('wrangler.toml production [vars] do not contain localhost, 127.0.0.1, workers.dev, or unverified Firebase origins in allowlist', () => {
      const wranglerContent = fs.readFileSync(wranglerFilePath, 'utf8');
      assert.strictEqual(
        /ALLOWED_ORIGINS.*localhost/.test(wranglerContent),
        false,
        'wrangler.toml must not include localhost in production ALLOWED_ORIGINS'
      );
      assert.strictEqual(
        /ALLOWED_ORIGINS.*127\.0\.0\.1/.test(wranglerContent),
        false,
        'wrangler.toml must not include 127.0.0.1 in production ALLOWED_ORIGINS'
      );
      assert.strictEqual(
        /ALLOWED_ORIGINS.*workers\.dev/.test(wranglerContent),
        false,
        'wrangler.toml must not include workers.dev in production ALLOWED_ORIGINS'
      );
      assert.strictEqual(
        /ALLOWED_ORIGINS.*firebaseapp\.com/.test(wranglerContent),
        false,
        'wrangler.toml must not include firebaseapp.com in production ALLOWED_ORIGINS'
      );
      assert.strictEqual(
        /ALLOWED_ORIGINS.*web\.app/.test(wranglerContent),
        false,
        'wrangler.toml must not include web.app in production ALLOWED_ORIGINS'
      );
    });

    it('worker.js DEFAULT_TRUSTED_ORIGINS contains strictly the 3 verified production origins', () => {
      assert.ok(DEFAULT_TRUSTED_ORIGINS instanceof Set);
      assert.strictEqual(DEFAULT_TRUSTED_ORIGINS.size, 3);
      assert.ok(DEFAULT_TRUSTED_ORIGINS.has('https://tiktalk.art'));
      assert.ok(DEFAULT_TRUSTED_ORIGINS.has('https://www.tiktalk.art'));
      assert.ok(DEFAULT_TRUSTED_ORIGINS.has('https://admin.tiktalk.art'));

      assert.strictEqual(DEFAULT_TRUSTED_ORIGINS.has('https://tiktalk-67725.firebaseapp.com'), false);
      assert.strictEqual(DEFAULT_TRUSTED_ORIGINS.has('https://tiktalk-67725.web.app'), false);
      assert.strictEqual(DEFAULT_TRUSTED_ORIGINS.has('http://localhost:8081'), false);
      assert.strictEqual(DEFAULT_TRUSTED_ORIGINS.has('http://localhost:3000'), false);
      assert.strictEqual(DEFAULT_TRUSTED_ORIGINS.has('http://127.0.0.1:8081'), false);
      assert.strictEqual(
        DEFAULT_TRUSTED_ORIGINS.has('https://tiktalk-media-edge.tiktalk67725.workers.dev'),
        false
      );
    });

    it('worker.js has zero arbitrary origin reflection', () => {
      const workerCode = fs.readFileSync(workerFilePath, 'utf8');
      assert.strictEqual(
        /const\s+origin\s*=\s*request\.headers\.get\(['"]Origin['"]\)\s*\|\|\s*['"]\*['"]/.test(workerCode),
        false,
        'worker.js must not fallback to reflection or wildcard for arbitrary origins'
      );
    });
  });

  describe('2. Verified Production Web Origins Allowed with Correct Headers', () => {
    const verifiedProductionOrigins = [
      'https://tiktalk.art',
      'https://www.tiktalk.art',
      'https://admin.tiktalk.art',
    ];

    for (const origin of verifiedProductionOrigins) {
      it(`Allows verified production origin: ${origin} on GET /health`, async () => {
        const req = new Request('https://edge.dev/health', {
          method: 'GET',
          headers: { Origin: origin },
        });
        const res = await worker.fetch(req, mockEnv);

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), origin);
        assert.strictEqual(res.headers.get('Access-Control-Allow-Credentials'), 'true');
        assert.strictEqual(res.headers.get('Vary'), 'Origin');
      });

      it(`Allows verified production origin: ${origin} on OPTIONS preflight`, async () => {
        const req = new Request('https://edge.dev/upload/video', {
          method: 'OPTIONS',
          headers: {
            Origin: origin,
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type, Authorization',
          },
        });
        const res = await worker.fetch(req, mockEnv);

        assert.strictEqual(res.status, 204);
        assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), origin);
        assert.strictEqual(
          res.headers.get('Access-Control-Allow-Methods'),
          'GET, HEAD, POST, DELETE, OPTIONS'
        );
        assert.ok(res.headers.get('Access-Control-Allow-Headers').includes('Authorization'));
        assert.ok(res.headers.get('Access-Control-Allow-Headers').includes('Content-Type'));
        assert.strictEqual(res.headers.get('Access-Control-Max-Age'), '86400');
        assert.strictEqual(res.headers.get('Vary'), 'Origin');
      });
    }
  });

  describe('3. Production Defaults Reject Localhost, 127.0.0.1, Resource-Host URL, and Unverified Firebase Origins', () => {
    const nonProductionOrigins = [
      'http://localhost:8081',
      'http://localhost:3000',
      'http://localhost:8080',
      'http://localhost:8082',
      'http://localhost:8787',
      'http://127.0.0.1:8081',
      'http://127.0.0.1:3000',
      'https://tiktalk-media-edge.tiktalk67725.workers.dev',
      'https://tiktalk-67725.firebaseapp.com',
      'https://tiktalk-67725.web.app',
    ];

    for (const origin of nonProductionOrigins) {
      it(`Production defaults reject: ${origin} on GET /health`, async () => {
        const req = new Request('https://edge.dev/health', {
          method: 'GET',
          headers: { Origin: origin },
        });
        const res = await worker.fetch(req, mockEnv);

        assert.strictEqual(
          res.headers.get('Access-Control-Allow-Origin'),
          null,
          `Production default must NOT return Access-Control-Allow-Origin for ${origin}`
        );
        assert.strictEqual(res.headers.get('Vary'), 'Origin');
      });

      it(`Production defaults reject OPTIONS preflight with 403 Forbidden for: ${origin}`, async () => {
        const req = new Request('https://edge.dev/upload/video', {
          method: 'OPTIONS',
          headers: {
            Origin: origin,
            'Access-Control-Request-Method': 'POST',
          },
        });
        const res = await worker.fetch(req, mockEnv);

        assert.strictEqual(res.status, 403);
        assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), null);
        assert.strictEqual(res.headers.get('Vary'), 'Origin');
      });
    }

    it('Worker resource-host URL (PUBLIC_CDN_URL) is NOT trusted solely because it is the resource host', async () => {
      const hostUrl = mockEnv.PUBLIC_CDN_URL;
      const hostOrigin = new URL(hostUrl).origin;

      const origins = getTrustedOrigins(mockEnv);
      assert.strictEqual(
        origins.has(hostOrigin),
        false,
        'Resource host origin must not be automatically added to trusted client origins'
      );

      const req = new Request('https://edge.dev/health', {
        method: 'GET',
        headers: { Origin: hostOrigin },
      });
      const res = await worker.fetch(req, mockEnv);
      assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), null);
    });
  });

  describe('4. Explicit Local Development Configuration Allows Local Origins Without Leaking to Production', () => {
    it('Allows local origins when explicitly provided in development env without affecting production defaults', async () => {
      const devEnv = {
        ...mockEnv,
        ALLOWED_ORIGINS: 'http://localhost:8081, http://localhost:3000',
      };

      // In dev environment: localhost:8081 is allowed
      const devReq = new Request('https://edge.dev/health', {
        method: 'GET',
        headers: { Origin: 'http://localhost:8081' },
      });
      const devRes = await worker.fetch(devReq, devEnv);
      assert.strictEqual(devRes.status, 200);
      assert.strictEqual(
        devRes.headers.get('Access-Control-Allow-Origin'),
        'http://localhost:8081'
      );

      // In production environment: localhost:8081 remains strictly rejected
      const prodReq = new Request('https://edge.dev/health', {
        method: 'GET',
        headers: { Origin: 'http://localhost:8081' },
      });
      const prodRes = await worker.fetch(prodReq, mockEnv);
      assert.strictEqual(prodRes.headers.get('Access-Control-Allow-Origin'), null);
    });

    it('Allows local development preflight OPTIONS when explicitly configured in development env', async () => {
      const devEnv = {
        ...mockEnv,
        ALLOWED_ORIGINS: 'http://localhost:8081',
      };

      const devReq = new Request('https://edge.dev/upload/video', {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:8081',
          'Access-Control-Request-Method': 'POST',
        },
      });
      const devRes = await worker.fetch(devReq, devEnv);
      assert.strictEqual(devRes.status, 204);
      assert.strictEqual(
        devRes.headers.get('Access-Control-Allow-Origin'),
        'http://localhost:8081'
      );
    });
  });

  describe('5. Arbitrary and Malicious Origins are Blocked', () => {
    const untrustedOrigins = [
      'https://evil-attacker.com',
      'https://attacker.net',
      'https://tiktalk.art.evil.com',
      'https://fake-tiktalk.art',
      'http://attacker-controlled-site.org',
      'null',
    ];

    for (const origin of untrustedOrigins) {
      it(`Never reflects untrusted origin on GET: ${origin}`, async () => {
        const req = new Request('https://edge.dev/health', {
          method: 'GET',
          headers: { Origin: origin },
        });
        const res = await worker.fetch(req, mockEnv);

        assert.strictEqual(
          res.headers.get('Access-Control-Allow-Origin'),
          null,
          `Untrusted origin ${origin} must NOT be returned in Access-Control-Allow-Origin`
        );
        assert.strictEqual(res.headers.get('Vary'), 'Origin');
      });

      it(`Rejects OPTIONS preflight with 403 Forbidden for untrusted origin: ${origin}`, async () => {
        const req = new Request('https://edge.dev/upload/story', {
          method: 'OPTIONS',
          headers: {
            Origin: origin,
            'Access-Control-Request-Method': 'POST',
          },
        });
        const res = await worker.fetch(req, mockEnv);

        assert.strictEqual(res.status, 403);
        assert.strictEqual(
          res.headers.get('Access-Control-Allow-Origin'),
          null,
          `Untrusted origin ${origin} must NOT receive Access-Control-Allow-Origin on preflight`
        );
        assert.strictEqual(res.headers.get('Vary'), 'Origin');
      });
    }
  });

  describe('6. Safe Handling of Requests Without Origin Header', () => {
    it('Succeeds on GET /health without Origin header', async () => {
      const req = new Request('https://edge.dev/health', { method: 'GET' });
      const res = await worker.fetch(req, mockEnv);

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'online');
      assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), null);
      assert.strictEqual(res.headers.get('Vary'), 'Origin');
    });

    it('Succeeds on public media GET /videos/sample.mp4 without Origin header', async () => {
      const req = new Request('https://edge.dev/videos/sample.mp4', { method: 'GET' });
      const res = await worker.fetch(req, mockEnv);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), null);
      assert.strictEqual(res.headers.get('Vary'), 'Origin');
    });

    it('Handles OPTIONS without Origin header gracefully', async () => {
      const req = new Request('https://edge.dev/videos/sample.mp4', { method: 'OPTIONS' });
      const res = await worker.fetch(req, mockEnv);

      assert.strictEqual(res.status, 204);
      assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), null);
      assert.strictEqual(res.headers.get('Vary'), 'Origin');
    });
  });

  describe('7. Credential Safety and Zero Wildcard Policy', () => {
    it('Never returns wildcard (*) as Access-Control-Allow-Origin', async () => {
      const originsToTest = [
        'https://tiktalk.art',
        'https://evil.com',
        '',
        undefined,
      ];

      for (const origin of originsToTest) {
        const headers = origin ? { Origin: origin } : {};
        const req = new Request('https://edge.dev/health', { method: 'GET', headers });
        const res = await worker.fetch(req, mockEnv);

        assert.notStrictEqual(
          res.headers.get('Access-Control-Allow-Origin'),
          '*',
          'Access-Control-Allow-Origin must NEVER be wildcard (*)'
        );
      }
    });

    it('Does not allow env.ALLOWED_ORIGINS = "*" to inject a literal wildcard', async () => {
      const wildcardEnv = {
        ...mockEnv,
        ALLOWED_ORIGIN: '*',
        ALLOWED_ORIGINS: '*',
      };

      const req = new Request('https://edge.dev/health', {
        method: 'GET',
        headers: { Origin: 'https://attacker.com' },
      });
      const res = await worker.fetch(req, wildcardEnv);

      assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), null);
    });
  });

  describe('8. Preservation of Authentication and Security Invariants', () => {
    it('Protected routes still require valid Authorization bearer token regardless of CORS origin', async () => {
      // With trusted origin
      const reqWithTrusted = new Request('https://edge.dev/upload/story', {
        method: 'POST',
        headers: { Origin: 'https://tiktalk.art' },
      });
      const res1 = await worker.fetch(reqWithTrusted, mockEnv);
      assert.strictEqual(res1.status, 401, 'Must require auth even with trusted origin');

      // Without origin
      const reqWithoutOrigin = new Request('https://edge.dev/upload/story', {
        method: 'POST',
      });
      const res2 = await worker.fetch(reqWithoutOrigin, mockEnv);
      assert.strictEqual(res2.status, 401, 'Must require auth without origin');
    });

    it('Raw /stories/* remains strictly 403 Forbidden regardless of origin', async () => {
      const req = new Request('https://edge.dev/stories/private.mp4', {
        method: 'GET',
        headers: { Origin: 'https://tiktalk.art' },
      });
      const res = await worker.fetch(req, mockEnv);
      assert.strictEqual(res.status, 403, 'Raw /stories/* path must remain blocked');
    });
  });
});
