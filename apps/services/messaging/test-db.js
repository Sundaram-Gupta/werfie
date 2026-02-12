
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        // Try to find one conversation or just empty findMany with select
        const convos = await prisma.conversation.findMany({
            take: 1,
            orderBy: { lastMessageAt: 'desc' },
            select: { id: true, lastMessageAt: true }
        });
        console.log('Successfully queried lastMessageAt. Result:', convos);
    } catch (e) {
        console.error('DB Query failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
