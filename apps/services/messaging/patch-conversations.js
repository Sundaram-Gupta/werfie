import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('🧹 Patching Conversation table using Prisma .update()...');
    try {
        // 1. Get raw records first to find IDs
        const nulls = await prisma.$queryRawUnsafe('SELECT id FROM "Conversation" WHERE "lastMessageAt" IS NULL');
        console.log(`🔍 Found ${nulls.length} conversations with NULL lastMessageAt.`);

        for (const row of nulls) {
            console.log(`🛠️ Patching conversation ${row.id}...`);
            try {
                const updated = await prisma.conversation.update({
                    where: { id: row.id },
                    data: {
                        lastMessageAt: new Date()
                    }
                });
                console.log(`✅ Patched ${updated.id}`);
            } catch (inner) {
                console.error(`❌ Failed to patch ${row.id}:`, inner.message);
            }
        }

        console.log('🎉 Patching complete.');

    } catch (e) {
        console.error('❌ Patch failed:', e.message);
    }
}

main().finally(() => prisma.$disconnect());
