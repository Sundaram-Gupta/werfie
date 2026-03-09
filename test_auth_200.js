#!/usr/bin/env node
/**
 * Test all Auth APIs expect 200 (or 201 for register).
 * Usage: node test_auth_200.js
 * Requires: Gateway running on http://localhost:3001 and user user1@xclone.com / password123 in DB.
 */
const http = require('http');

const BASE = 'http://localhost:3001';
const LOGIN_BODY = JSON.stringify({ email: 'user1@xclone.com', password: 'password123' });
const REGISTER_BODY = JSON.stringify({
  email: `test-${Date.now()}@example.com`,
  password: 'password123',
  name: 'Test User',
  handle: `testuser${Date.now()}`.slice(-12)
});

function request(method, path, body = null, token = null) {
  const url = new URL(path, BASE);
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body) opts.headers['Content-Length'] = Buffer.byteLength(body);

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null,
            raw: data
          });
        } catch {
          resolve({ status: res.statusCode, data: null, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function run() {
  let passed = 0;
  let failed = 0;
  let accessToken, refreshToken;

  console.log('=== Auth API tests (expect 200/201) ===\n');

  // 1. Login
  try {
    const r = await request('POST', '/api/auth/login', LOGIN_BODY);
    if (r.status === 200 && r.data && r.data.accessToken) {
      accessToken = r.data.accessToken;
      refreshToken = r.data.refreshToken;
      console.log('[PASS] POST /api/auth/login -> 200');
      passed++;
    } else {
      console.log('[FAIL] POST /api/auth/login ->', r.status, r.raw?.slice(0, 80));
      failed++;
    }
  } catch (e) {
    console.log('[FAIL] POST /api/auth/login ->', e.message);
    failed++;
  }

  if (!accessToken) {
    console.log('\nLogin failed; cannot test protected routes. Ensure gateway and DB are up and user1@xclone.com exists.');
    process.exit(1);
  }

  // 2. GET /api/auth/me
  try {
    const r = await request('GET', '/api/auth/me', null, accessToken);
    if (r.status === 200) {
      console.log('[PASS] GET /api/auth/me -> 200');
      passed++;
    } else {
      console.log('[FAIL] GET /api/auth/me ->', r.status);
      failed++;
    }
  } catch (e) {
    console.log('[FAIL] GET /api/auth/me ->', e.message);
    failed++;
  }

  // 3. POST /api/auth/refresh
  if (refreshToken) {
    try {
      const r = await request('POST', '/api/auth/refresh', JSON.stringify({ refreshToken }));
      if (r.status === 200 && r.data && r.data.accessToken) {
        console.log('[PASS] POST /api/auth/refresh -> 200');
        passed++;
      } else {
        console.log('[FAIL] POST /api/auth/refresh ->', r.status);
        failed++;
      }
    } catch (e) {
      console.log('[FAIL] POST /api/auth/refresh ->', e.message);
      failed++;
    }
  }

  // 4. POST /api/auth/logout (use access token)
  try {
    const r = await request('POST', '/api/auth/logout', null, accessToken);
    if (r.status === 200) {
      console.log('[PASS] POST /api/auth/logout -> 200');
      passed++;
    } else {
      console.log('[FAIL] POST /api/auth/logout ->', r.status, r.data?.error || '');
      failed++;
    }
  } catch (e) {
    console.log('[FAIL] POST /api/auth/logout ->', e.message);
    failed++;
  }

  // 5. Re-login for change-password
  let token2;
  try {
    const r = await request('POST', '/api/auth/login', LOGIN_BODY);
    if (r.status === 200 && r.data && r.data.accessToken) token2 = r.data.accessToken;
  } catch (_) {}
  if (token2) {
    try {
      const r = await request('POST', '/api/auth/change-password', JSON.stringify({
        currentPassword: 'password123',
        newPassword: 'password123'
      }), token2);
      if (r.status === 200) {
        console.log('[PASS] POST /api/auth/change-password -> 200');
        passed++;
      } else {
        console.log('[FAIL] POST /api/auth/change-password ->', r.status, r.data?.error || '');
        failed++;
      }
    } catch (e) {
      console.log('[FAIL] POST /api/auth/change-password ->', e.message);
      failed++;
    }
  }

  // 6. Register (expect 201)
  try {
    const r = await request('POST', '/api/auth/register', REGISTER_BODY);
    if (r.status === 201) {
      console.log('[PASS] POST /api/auth/register -> 201');
      passed++;
    } else {
      console.log('[FAIL] POST /api/auth/register ->', r.status, r.data?.error || '');
      failed++;
    }
  } catch (e) {
    console.log('[FAIL] POST /api/auth/register ->', e.message);
    failed++;
  }

  console.log('\n--- Summary ---');
  console.log('Passed:', passed, ' Failed:', failed);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
