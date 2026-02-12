import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Checking database for users...');

    try {
        const users = await prisma.$queryRawUnsafe('SELECT id, email FROM "User"');
        console.log('👥 Users found in "User" table:', users.length);
        users.forEach(u => console.log(`- ${u.email} (${u.id})`));
    } catch (e) {
        console.error('❌ Error querying "User" table:', e.message);
    }

    try {
        const conversations = await prisma.conversation.count();
        console.log('💬 Conversations count:', conversations);
    } catch (e) {
        console.error('❌ Error querying conversations:', e.message);
    }
}

main().finally(() => prisma.$disconnect());
