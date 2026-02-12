
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const axios = require('axios');

async function main() {
    const email = 'test_login_user@example.com';
    const password = 'password123';

    try {
        // 1. Ensure user exists
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.log('Creating test user...');
            const passwordHash = await bcrypt.hash(password, 10);
            user = await prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    profile: {
                        create: {
                            name: 'Test User',
                            handle: 'test_user_handle_123'
                        }
                    }
                }
            });
            console.log('User created:', user.id);
        } else {
            console.log('User already exists:', user.id);
            // Update password to be sure
            const passwordHash = await bcrypt.hash(password, 10);
            await prisma.user.update({
                where: { id: user.id },
                data: { passwordHash }
            });
        }

        // 2. Try Login API
        console.log('Attempting login via API...');
        try {
            const response = await axios.post('http://localhost:3001/api/auth/login', {
                email,
                password
            });
            console.log('Login Successful!');
            console.log('Status:', response.status);
            console.log('Token received:', !!response.data.accessToken);
        } catch (apiError) {
            console.error('Login Failed Status:', apiError.response?.status);
            console.error('Login Failed Data:', apiError.response?.data);
            throw apiError;
        }

    } catch (e) {
        console.error('Setup Failed:', e.message);
    }

    try {
        // 2. Test Valid Login
        console.log('\n--- Test 1: Valid Login ---');
        try {
            const response = await axios.post('http://localhost:3001/api/auth/login', {
                email,
                password
            });
            console.log('✅ Login Successful! Status:', response.status);
        } catch (error) {
            console.error('❌ Valid Login Failed:', error.response?.status, error.response?.data);
        }

        // 3. Test Invalid Password
        console.log('\n--- Test 2: Invalid Password ---');
        try {
            await axios.post('http://localhost:3001/api/auth/login', {
                email,
                password: 'wrongpassword'
            });
            console.error('❌ Expected 401 but got success');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Correctly handled invalid password (401)');
            } else {
                console.error('❌ Unexpected error:', error.response?.status, error.response?.data);
            }
        }

        // 4. Test Non-existent User
        console.log('\n--- Test 3: Non-existent User ---');
        try {
            await axios.post('http://localhost:3001/api/auth/login', {
                email: 'ghost@example.com',
                password: 'password123'
            });
            console.error('❌ Expected 401 but got success');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Correctly handled non-existent user (401)');
            } else {
                console.error('❌ Unexpected error:', error.response?.status, error.response?.data);
            }
        }

    } finally {
        await prisma.$disconnect();
    }
}

main();
