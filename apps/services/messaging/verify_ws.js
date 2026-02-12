
import io from 'socket.io-client';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

console.log('--- Testing WebSocket Connection ---');

// Generate Token
const token = jwt.sign({
    userId: 'test-user-ws-123',
    sub: 'test-user-ws-123',
    type: 'access'
}, JWT_SECRET);

console.log('🔑 Token Generated');

// Connect to Messaging Service directly (3019)
const socket = io('http://localhost:3019', {
    path: '/api/messages/ws',
    auth: { token },
    extraHeaders: {
        Origin: "http://localhost:5173"
    },
    transports: ['websocket']
});

socket.on('connect', () => {
    console.log('✅ Connected to WebSocket! Socket ID:', socket.id);
    socket.disconnect();
    process.exit(0);
});

socket.on('connect_error', (err) => {
    console.error('❌ Connection Error:', err.message);
    if (err.description) console.error('   Description:', err.description);
    // process.exit(1); // Keep open to see if it retries or gives more info
});

socket.on('disconnect', (reason) => {
    console.log('Disconnected:', reason);
});

// Timeout
setTimeout(() => {
    console.error('❌ Timeout: Could not connect in 5 seconds');
    process.exit(1);
}, 5000);
