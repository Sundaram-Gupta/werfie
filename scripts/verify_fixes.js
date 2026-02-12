const axios = require('axios');

const MESSAGING_URL = 'http://localhost:3019/api/messages';
const CONTENT_URL = 'http://localhost:3003/api';

async function verifyMessaging() {
    console.log('--- Verifying Messaging Service ---');
    try {
        // 1. Health/Conversations (Assume auth might fail without token, but check connectivity)
        // We'll just check if the service is reachable on a public endpoint or root
        try {
            await axios.get('http://localhost:3019/');
            console.log('✅ Messaging Service Reachable');
        } catch (e) {
            if (e.response && e.response.status === 404) console.log('✅ Messaging Service Reachable (404 on root is expected)');
            else console.log('❌ Messaging Service Unreachable:', e.message);
        }
    } catch (error) {
        console.error('Messaging Verification Failed:', error.message);
    }
}

async function verifyContent() {
    console.log('\n--- Verifying Content Service ---');
    try {
        const res = await axios.get('http://localhost:3003/health');
        console.log(`✅ Content Service Health: ${res.data.status}`);
    } catch (e) {
        console.error('❌ Content Service Unreachable:', e.message);
    }
}

async function run() {
    await verifyMessaging();
    await verifyContent();
}

run();
