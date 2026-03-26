const jwt = require('jsonwebtoken');
const axios = require('axios');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const token = jwt.sign(
  {
    userId: '303a5745-b13a-4a51-8159-b39a1dc1b065',
    id: '303a5745-b13a-4a51-8159-b39a1dc1b065',
    email: 'test@example.com'
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

async function testFetch() {
  console.log('Testing GET /api/posts ...');
  const start = Date.now();
  try {
    const res = await axios.get('http://127.0.0.1:3001/api/posts', {
      params: { tab: 'for-you', limit: 20, seed: 123456 },
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000
    });
    console.log(`Success in ${Date.now() - start}ms. Data length:`, JSON.stringify(res.data).length);
  } catch (err) {
    console.error(`Error in ${Date.now() - start}ms:`, err.message);
  }
}

testFetch();
