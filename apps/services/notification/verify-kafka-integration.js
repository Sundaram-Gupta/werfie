import axios from 'axios';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const NOTIFICATION_PRISMA = new PrismaClient();
const MESSAGING_URL = 'http://127.0.0.1:3019/api/messages';
const JWT_SECRET = 'dev-secret';

const createToken = (userId, email) => {
    return jwt.sign({ userId, email, sub: userId }, JWT_SECRET, { expiresIn: '1h' });
};

// Using real IDs from the DB to pass Zod UUID validation
const userA = { id: 'c0c4cb90-e152-481b-8cc1-10c910f431e9', email: 'user49@xclone.com' };
const userB = { id: 'ba943b3c-3697-465c-ac5b-1ca084e4f5fb', email: 'user50@xclone.com' };

const tokenA = createToken(userA.id, userA.email);

const api = axios.create({
    baseURL: MESSAGING_URL,
    validateStatus: () => true
});

async function verify() {
    console.log('🧪 Starting Integrated Kafka Notification Verification...');

    try {
        // 1. Send Message from User A to User B
        console.log(`\n1. Sending message from ${userA.email} to ${userB.email}...`);
        const sendRes = await api.post('/send', {
            recipientId: userB.id,
            content: 'Kafka Test Message ' + new Date().toISOString()
        }, {
            headers: { Authorization: `Bearer ${tokenA}` }
        });

        if (sendRes.status !== 200) {
            console.error('❌ Failed to send message:', sendRes.status, sendRes.data);
            return;
        }
        console.log('✅ Message sent successfully.');

        // 2. Wait for Kafka processing
        console.log('\n2. Waiting 5 seconds for Kafka processing...');
        await new Promise(r => setTimeout(r, 5000));

        // 3. Check Notification Service DB
        console.log('\n3. Checking database for new notification...');
        const notifications = await NOTIFICATION_PRISMA.notification.findMany({
            where: {
                userId: userB.id,
                type: 'message',
                actorId: userA.id
            },
            orderBy: { createdAt: 'desc' },
            take: 1
        });

        if (notifications.length > 0) {
            const n = notifications[0];
            console.log('✅ Success! Notification found in DB:');
            console.log('   ID:', n.id);
            console.log('   Type:', n.type);
            console.log('   Recipient:', n.userId);
            console.log('   Actor:', n.actorId);
        } else {
            console.warn('⚠️ No notification found. Check Kafka and PM2 logs.');
            console.log('   Hint: Make sure notification-service is running and Kafka is reachable.');
        }

    } catch (err) {
        console.error('❌ Verification Error:', err.message);
    } finally {
        await NOTIFICATION_PRISMA.$disconnect();
    }
}

verify();
