#!/usr/bin/env node
/**
 * Werfie API Test Suite - Tests all APIs and generates error report
 * Run: node test_apis_report.js
 * Output: API_TEST_REPORT.md
 */

const http = require('http');
const https = require('https');

const BASE = 'http://localhost:3001';
const ADMIN = 'http://localhost:3012';
const MESSAGING = 'http://localhost:3019';

let token = null;
let refreshToken = null;
let userId = null;
let adminToken = null;

const results = [];
const errors = [];

function request(method, url, body = null, useToken = false, useAdminToken = false) {
    return new Promise((resolve) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const lib = isHttps ? https : http;

        const headers = { 'Content-Type': 'application/json' };
        if (useToken && token) headers['Authorization'] = `Bearer ${token}`;
        if (useAdminToken && adminToken) headers['Authorization'] = `Bearer ${adminToken}`;

        const opts = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method,
            headers
        };

        const req = lib.request(opts, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                let parsed = null;
                try { parsed = JSON.parse(data); } catch (_) {}
                resolve({ status: res.statusCode, data, parsed, headers: res.headers });
            });
        });
        req.on('error', (e) => resolve({ status: 'ERR', error: e.message }));
        if (body && method !== 'GET') req.write(typeof body === 'string' ? body : JSON.stringify(body));
        req.end();
    });
}

async function test(name, method, url, body = null, auth = false, adminAuth = false) {
    const r = await request(method, url, body, auth, adminAuth);
    const ok = r.status >= 200 && r.status < 300;
    results.push({ name, method, url, status: r.status, ok });
    if (!ok) {
        errors.push({
            name,
            method,
            url,
            status: r.status,
            error: r.error || (r.parsed?.message || r.parsed?.error || r.data?.slice?.(0, 100))
        });
    }
    return r;
}

async function run() {
    console.log('=== Werfie API Test Suite ===\n');
    console.log('1. Logging in...');
    const logins = [
        { email: 'apitest@example.com', password: 'password123' },
        { email: 'testuser@example.com', password: 'password123' },
        { email: 'user1@xclone.com', password: 'password123' },
        { email: 'john@example.com', password: 'password123' },
        { email: 'test@gmail.com', password: 'password123' }
    ];
    for (const cred of logins) {
        const loginRes = await request('POST', `${BASE}/api/auth/login`, cred);
        if (loginRes.parsed?.data?.accessToken || loginRes.parsed?.accessToken) {
            token = loginRes.parsed?.data?.accessToken || loginRes.parsed.accessToken;
            refreshToken = loginRes.parsed?.data?.refreshToken || loginRes.parsed.refreshToken;
            userId = loginRes.parsed?.data?.id || loginRes.parsed?.id;
            console.log(`   OK - Got token (${cred.email})`);
            break;
        }
    }

    if (!token) {
        console.log('   FAIL - No token. Ensure auth service is running and testuser@example.com or user1@xclone.com exists.');
    }

    console.log('\n2. Admin login...');
    const adminLogin = await request('POST', `${ADMIN}/api/admin/login`, { email: 'admin@example.com', password: 'admin' });
    if (adminLogin.parsed?.data?.token) adminToken = adminLogin.parsed.data.token;
    else if (adminLogin.parsed?.token) adminToken = adminLogin.parsed.token;
    if (adminToken) console.log('   OK'); else console.log('   WARN - No admin token');

    console.log('\n3. Testing APIs...\n');

    // Auth
    await test('Auth /me', 'GET', `${BASE}/api/auth/me`, null, true);
    await test('Auth /health', 'GET', `${BASE}/api/health`);
    await test('Auth /trends', 'GET', `${BASE}/api/trends?limit=5`);

    // Users
    await test('Users profile', 'GET', `${BASE}/api/users/profile`, null, true);
    if (userId) await test('Users get', 'GET', `${BASE}/api/users/${userId}`, null, true);
    await test('Users search', 'GET', `${BASE}/api/users/search?q=user&limit=5`);
    await test('Users suggestions', 'GET', `${BASE}/api/users/suggestions?limit=5`);

    // Posts
    await test('Posts feed', 'GET', `${BASE}/api/posts?limit=5`, null, true);
    await test('Posts timeline home', 'GET', `${BASE}/api/posts/timeline/home?limit=5`, null, true);
    await test('Posts following', 'GET', `${BASE}/api/posts/following?limit=5`, null, true);
    await test('Posts bookmarks', 'GET', `${BASE}/api/posts/bookmarks`, null, true);
    await test('Posts search', 'GET', `${BASE}/api/posts/search?q=test&limit=5`);

    // Explore
    await test('Explore', 'GET', `${BASE}/api/explore?limit=5`);
    await test('Communities', 'GET', `${BASE}/api/communities`);

    // Notifications (via gateway - goes to content 3003)
    await test('Notifications', 'GET', `${BASE}/api/notifications?limit=5`, null, true);

    // Spaces, Lists
    await test('Spaces list', 'GET', `${BASE}/api/spaces`);
    await test('Lists pinned', 'GET', `${BASE}/api/lists/pinned`, null, true);
    await test('Lists discover', 'GET', `${BASE}/api/lists/discover`);

    // Ads, Business, Institutional
    await test('Ads account', 'GET', `${BASE}/api/ads/account`, null, true);
    await test('Ads campaigns', 'GET', `${BASE}/api/ads/campaigns`, null, true);
    await test('Business', 'GET', `${BASE}/api/business`, null, true);
    await test('Institutional', 'GET', `${BASE}/api/institutional`, null, true);

    // World Leaders
    await test('Leaders list', 'GET', `${BASE}/api/leaders`);

    // Announcements
    await test('Announcements feed', 'GET', `${BASE}/api/announcements/feed`);

    // Messaging
    await test('Messaging conversations', 'GET', `${BASE}/api/messages/conversations?limit=5`, null, true);
    await test('Messaging health', 'GET', `${MESSAGING}/api/messages/health`);

    // Monetization
    await test('Monetization profile', 'GET', `${BASE}/api/monetization/profile`, null, true);
    await test('Monetization stats', 'GET', `${BASE}/api/monetization/stats`, null, true);

    // Moderation
    await test('Moderation report', 'POST', `${BASE}/api/moderation/report`, { contentType: 'post', contentId: 'test-id', reason: 'test' }, true);

    // Settings
    await test('Settings', 'GET', `${BASE}/api/settings`, null, true);
    await test('Settings health', 'GET', `${BASE}/api/settings/health`);

    // Search
    await test('Search posts', 'GET', `${BASE}/api/search/posts?q=test`);
    await test('Search health', 'GET', `${BASE}/api/search/health`);

    // Feed, Enterprise
    await test('Feed world-leaders', 'GET', `${BASE}/api/feed/world-leaders`);
    await test('Enterprise metrics', 'GET', `${BASE}/api/enterprise/metrics/overview`, null, true);
    await test('Enterprise signals', 'GET', `${BASE}/api/enterprise/signals`, null, true);

    // Admin
    await test('Admin health', 'GET', `${ADMIN}/api/admin/health`, null, false, false);
    await test('Admin login', 'POST', `${ADMIN}/api/admin/login`, { email: 'admin@example.com', password: 'admin' });
    if (adminToken) {
        await test('Admin dashboard stats', 'GET', `${ADMIN}/api/admin/dashboard/stats`, null, false, true);
        await test('Admin users', 'GET', `${ADMIN}/api/admin/users`, null, false, true);
        await test('Admin reports', 'GET', `${ADMIN}/api/admin/reports`, null, false, true);
        await test('Admin docs', 'GET', `${ADMIN}/api/docs`);
    }

    // Health checks
    await test('User service health', 'GET', 'http://localhost:3002/health');
    await test('Content service health', 'GET', 'http://localhost:3003/health');
    await test('Moderation health', 'GET', `${BASE}/api/moderation/health`);
    await test('Monetization health', 'GET', `${BASE}/api/monetization/health`);

    // Generate report
    const passed = results.filter(r => r.ok).length;
    const failed = results.filter(r => !r.ok).length;

    const report = `# Werfie API Test Report
Generated: ${new Date().toISOString()}

## Summary
| Metric | Count |
|--------|-------|
| **Total** | ${results.length} |
| **Passed** | ${passed} |
| **Failed** | ${failed} |
| **Success Rate** | ${(passed / results.length * 100).toFixed(1)}% |

## Errored APIs
${errors.length === 0 ? '_No errors._' : errors.map(e => `
### ${e.name}
- **Method:** ${e.method}
- **URL:** ${e.url}
- **Status:** ${e.status}
- **Error:** ${e.error || 'N/A'}
`).join('\n')}

## All Results
| Name | Method | URL | Status | Result |
|------|--------|-----|--------|--------|
${results.map(r => `| ${r.name} | ${r.method} | ${r.url.replace(BASE, '').replace(ADMIN, '').replace(MESSAGING, '')} | ${r.status} | ${r.ok ? '✅' : '❌'} |`).join('\n')}
`;

    const fs = require('fs');
    fs.writeFileSync('API_TEST_REPORT.md', report);
    console.log('\n=== Report Generated ===');
    console.log(`Passed: ${passed} | Failed: ${failed} | Total: ${results.length}`);
    console.log('\nErrored APIs:');
    errors.forEach(e => console.log(`  ❌ [${e.status}] ${e.name} - ${e.url}`));
    console.log(`\nFull report saved to API_TEST_REPORT.md\n`);
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
