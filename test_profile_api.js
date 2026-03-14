/**
 * Test GET /api/users/profile - verifies location, website, birthdate, gender are in response
 * Usage: node test_profile_api.js [email] [password]
 * Example: node test_profile_api.js test@gmail.com yourpassword
 */

const BASE = process.env.API_BASE || 'http://localhost:3001';
const email = process.argv[2] || 'test@gmail.com';
const password = process.argv[3] || 'password123';

async function test() {
  console.log('1. Logging in...');
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData?.data?.accessToken) {
    console.error('Login failed:', loginData?.message || loginRes.status);
    process.exit(1);
  }
  const token = loginData.data.accessToken;
  console.log('   Login OK');

  console.log('2. Fetching GET /api/users/profile...');
  const profileRes = await fetch(`${BASE}/api/users/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const profileData = await profileRes.json();
  if (!profileRes.ok) {
    console.error('Profile fetch failed:', profileData?.message || profileRes.status);
    process.exit(1);
  }

  const user = profileData?.data ?? profileData;
  const profile = user?.profile;

  console.log('3. Checking profile fields...\n');
  const required = ['location', 'website', 'birthdate', 'gender'];
  let ok = true;
  for (const field of required) {
    const has = profile && Object.hasOwnProperty.call(profile, field);
    const val = profile?.[field];
    console.log(`   ${field}: ${has ? (val === null || val === undefined ? 'null/undefined' : val) : 'MISSING'}`);
    if (!has) ok = false;
  }
  console.log(ok ? '\n   All required profile fields are present.' : '\n   Some fields are missing.');
  process.exit(ok ? 0 : 1);
}

test().catch((e) => {
  console.error(e);
  process.exit(1);
});
