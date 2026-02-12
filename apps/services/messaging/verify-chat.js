import axios from 'axios';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://127.0.0.1:3016/api/messages';
const JWT_SECRET = 'dev-secret'; // Default for dev

// Helper to create token
const createToken = (userId, email) => {
    return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '1h' });
};

const user1 = { id: 'test-user-1', email: 'user1@example.com' };
const user2 = { id: 'test-user-2', email: 'user2@example.com' };

const token1 = createToken(user1.id, user1.email);
const token2 = createToken(user2.id, user2.email);

const api = axios.create({
    baseURL: BASE_URL,
    validateStatus: () => true // Don't throw on error
});

async function runTests() {
    console.log('🚀 Starting Chat Verification...');

    // 1. Create Conversation (User 1 -> User 2)
    console.log('\nTesting Create Conversation...');
    const createRes = await api.post('/conversations', {
        recipientId: user2.id
    }, {
        headers: { Authorization: `Bearer ${token1}` }
    });

    if (createRes.status !== 200) {
        console.error('❌ Create Failed:', createRes.status, createRes.data);
        return;
    }
    const conversation = createRes.data;
    console.log('✅ Conversation Created:', conversation.id);

    // 2. Fetch Conversations (User 1)
    console.log('\nTesting Fetch Conversations...');
    const fetchRes = await api.get('/conversations', {
        headers: { Authorization: `Bearer ${token1}` }
    });

    if (fetchRes.status !== 200) {
        console.error('❌ Fetch Failed:', fetchRes.status, fetchRes.data);
        return;
    }
    console.log('✅ Conversations Fetched:', fetchRes.data.length);

    // 3. Send Message (User 1 -> User 2)
    console.log('\nTesting Send Message...');
    const sendRes = await api.post('/send', {
        recipientId: user2.id,
        content: 'Hello from verify-chat.js'
    }, {
        headers: { Authorization: `Bearer ${token1}` }
    });

    if (sendRes.status !== 200) {
        console.error('❌ Send Failed:', sendRes.status, sendRes.data);
        return;
    }
    const message = sendRes.data;
    console.log('✅ Message Sent:', message.id, message.content);

    // 4. Validate Validation (Missing Content)
    console.log('\nTesting Validation (Invalid Request)...');
    const invalidRes = await api.post('/send', {
        recipientId: user2.id,
        // No content
    }, {
        headers: { Authorization: `Bearer ${token1}` }
    });

    if (invalidRes.status === 400) {
        console.log('✅ Validation Worked (Got 400 as expected)');
    } else {
        console.error('❌ Validation Failed:', invalidRes.status, invalidRes.data);
    }

    console.log('\n🎉 Verification Complete!');
}

runTests().catch(console.error);
