import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Checking for NULL lastMessageAt in Conversation table (Raw SQL)...');
    try {
        const nulls = await prisma.$queryRawUnsafe(`
            SELECT id FROM "Conversation" WHERE "lastMessageAt" IS NULL
        `);
        console.log('📊 NULL lastMessageAt count:', nulls.length);
        if (nulls.length > 0) {
            console.log('❌ Found NULL values for IDs:', nulls.map(n => n.id));
        } else {
            console.log('✅ No NULL values found in lastMessageAt.');
        }

        const nullLastMsgId = await prisma.$queryRawUnsafe(`
            SELECT id FROM "Conversation" WHERE "lastMessageId" IS NULL
        `);
        console.log('📊 NULL lastMessageId count:', nullLastMsgId.length);

    } catch (e) {
        console.error('❌ Error during check:', e.message);
    }
}

main().finally(() => prisma.$disconnect());
