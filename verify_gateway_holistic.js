
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { io } from 'socket.io-client';

const JWT_SECRET = 'dev-secret';
const GATEWAY_URL = 'http://127.0.0.1:3001';

// Generate a mock token
const token = jwt.sign({
    userId: 'test-user-gateway',
    sub: 'test-user-gateway',
    email: 'gateway@example.com'
}, JWT_SECRET);

async function testREST() {
    console.log('\n--- 1. Testing REST through Gateway (3001) ---');
    const endpoints = [
        '/api/posts?tab=for-you',
        '/api/messages/conversations'
    ];

    for (const path of endpoints) {
        const url = `${GATEWAY_URL}${path}`;
        console.log(`GET ${url}`);
        try {
            const resp = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`✅ ${path} Success: ${resp.status}`);
        } catch (e) {
            console.error(`❌ ${path} Failed: ${e.response?.status}`);
            if (e.response?.data) console.log('Error Data:', e.response.data);
        }
    }
}

function testWS() {
    console.log('\n--- 2. Testing WS through Gateway (3001) ---');
    const socket = io(GATEWAY_URL, {
        path: '/api/messages/ws',
        auth: { token }
    });

    socket.on('connect', () => {
        console.log('✅ WS Connected via Gateway!');
        socket.disconnect();
    });

    socket.on('connect_error', (err) => {
        console.error('❌ WS Connection Error:', err.message);
        process.exit(1);
    });

    setTimeout(() => {
        if (!socket.connected) {
            console.error('❌ WS Timeout');
            process.exit(1);
        }
    }, 5000);
}

async function run() {
    await testREST();
    testWS();
}

run();
