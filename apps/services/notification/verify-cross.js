import { PrismaClient } from '../../content/node_modules/@prisma/client/index.js';
const prisma = new PrismaClient();

async function test() {
    try {
        console.log('Testing with Content Service Prisma Client...');
        const notifications = await prisma.notification.findMany({
            take: 1,
            include: {
                actor: {
                    include: { profile: true }
                }
            }
        });
        console.log('Success! Actor name:', notifications[0]?.actor?.profile?.name || 'MISSING');
    } catch (error) {
        console.error('Cross-service Test Failed:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

test();
