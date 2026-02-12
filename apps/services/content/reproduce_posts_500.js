
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

async function main() {
    const email = 'test_posts_user@example.com';
    const password = 'password123';
    let token;

    try {
        // 1. Create User (Directly in DB to be sure)
        // We need to write to the User table, which is shared via Prisma?
        // Actually, auth-service controls User table. 
        // Content service also has User model in its schema?
        // Let's assume they point to the same DB or we just mock the token.

        // Mock Token Approach (faster/cleaner for service testing)
        // We know JWT_SECRET is 'dev-secret'
        token = jwt.sign({
            userId: 'test-user-id-123',
            email,
            sub: 'test-user-id-123',
            type: 'access'
        }, JWT_SECRET);

        console.log('✅ Generated Test Token');

    } catch (e) {
        console.error('Setup Failed:', e);
        return;
    }

    // 2. Test Posts API
    console.log('\n--- Testing /api/posts ---');
    try {
        // Hit Content Service directly on 3003
        const url = 'http://localhost:3003/api/posts?tab=for-you';
        console.log(`GET ${url}`);

        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Posts API Success:', response.status);
        console.log('Data:', response.data.posts?.length || 0, 'posts');

    } catch (error) {
        console.error('❌ Posts API Failed:', error.response?.status);
        console.error('Error Data:', JSON.stringify(error.response?.data, null, 2)); // Pretty print
        if (typeof error.response?.data === 'string') {
            console.log('Error Body:', error.response.data);
        }
    }
}

main();
