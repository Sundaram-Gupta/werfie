import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
    try {
        console.log('Testing Isolated Manual Join...');

        const notifications = await prisma.notification.findMany({
            take: 1
        });

        if (notifications.length > 0) {
            const n = notifications[0];
            console.log('Notification:', n.id, 'actorId:', n.actorId);

            const actor = await prisma.user.findUnique({
                where: { id: n.actorId }
            });
            console.log('Actor found:', !!actor);

            if (actor) {
                const profile = await prisma.profile.findUnique({
                    where: { userId: n.actorId }
                });
                console.log('Profile found:', !!profile);
                console.log('Name:', profile?.name || 'MISSING');
            }
        } else {
            console.log('No notifications found.');
        }

        console.log('Verification Success!');
    } catch (error) {
        console.error('Isolated Test Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
