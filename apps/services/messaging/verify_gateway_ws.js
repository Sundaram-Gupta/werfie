
import { io } from "socket.io-client";
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'dev-secret';
const GATEWAY_URL = 'http://localhost:3001';

// Generate a mock token
const token = jwt.sign({
    userId: 'test-user-ws',
    email: 'test-ws@example.com'
}, JWT_SECRET);

console.log('--- Testing WebSocket via Gateway ---');
console.log(`Target: ${GATEWAY_URL}/api/messages/ws`);

const socket = io(GATEWAY_URL, {
    path: '/api/messages/ws',
    auth: { token },
    transports: ['websocket', 'polling']
});

socket.on('connect', () => {
    console.log('✅ Connected via Gateway!', socket.id);
    socket.disconnect();
    process.exit(0);
});

socket.on('connect_error', (err) => {
    console.error('❌ Connection Error:', err.message);
    // console.log(err);
    if (err.description) console.error('Description:', err.description);
    // process.exit(1); // Don't exit immediately, let it retry or timeout
});

setTimeout(() => {
    console.error('❌ Timeout connecting via Gateway');
    process.exit(1);
}, 5000);
