
import axios from 'axios';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'dev-secret';
const MESSAGING_URL = 'http://localhost:3019';

// Generate a mock token
const token = jwt.sign({
    userId: 'test-user-ws',
    email: 'test-ws@example.com'
}, JWT_SECRET);

async function main() {
    console.log('--- Testing Messaging API Direct ---');

    const paths = [
        '/api/hello',
        '/api/messages/conversations',
        '/api/conversations',
        '/messages/conversations'
    ];

    for (const path of paths) {
        const url = `${MESSAGING_URL}${path}`;
        console.log(`\nGET ${url}`);
        try {
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ API Success:', response.status);
            console.log('Data:', JSON.stringify(response.data).substring(0, 100));
            return;
        } catch (error) {
            console.error('❌ API Failed:', error.response?.status);
            if (error.response?.status === 404 && error.response?.data && typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE html>')) {
                console.log('Received HTML 404 page (Next.js)');
            } else if (error.response?.data) {
                console.log('Error Data:', error.response.data);
            }
        }
    }
}

main().catch(err => console.error('Script Error:', err));
