const { PrismaClient } = require('./prisma/client/index.js');
const prisma = new PrismaClient();

async function test() {
    try {
        console.log('Testing Notification Enrichment (CJS)...');

        const notifications = await prisma.notification.findMany({
            take: 1,
            include: {
                actor: {
                    include: { profile: true }
                }
            }
        });

        if (notifications.length > 0) {
            const n = notifications[0];
            console.log('Notification found:', n.id);
            console.log('Actor name:', n.actor?.profile?.name || 'MISSING');
        } else {
            console.log('No notifications found.');
        }

        console.log('Verification Success!');
    } catch (error) {
        console.error('Prisma Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

test();
