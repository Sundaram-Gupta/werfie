import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Checking for orphaned lastMessageId in Conversation table...');
    try {
        const orphaned = await prisma.$queryRawUnsafe(`
            SELECT c.id, c."lastMessageId"
            FROM "Conversation" c
            WHERE c."lastMessageId" IS NOT NULL
            AND NOT EXISTS (
                SELECT 1 FROM "Message" m WHERE m.id = c."lastMessageId"
            )
        `);
        console.log('📊 Orphaned counts:', orphaned.length);
        if (orphaned.length > 0) {
            console.log('❌ Found orphaned references:', orphaned);
        } else {
            console.log('✅ No orphaned messages found.');
        }

        // Also check if any lastMessageAt is null (though schema says default now)
        const nullDates = await prisma.conversation.count({
            where: { lastMessageAt: null }
        });
        console.log('📊 Null lastMessageAt count:', nullDates);

    } catch (e) {
        console.error('❌ Error during check:', e.message);
    }
}

main().finally(() => prisma.$disconnect());
