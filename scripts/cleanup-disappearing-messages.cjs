const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
    console.log('[Cleanup] Starting disappearing messages cleanup...');
    const now = new Date();

    // 1h mode
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    // 24h mode
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    // 7d mode
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    try {
        // This is complex because each conversation has different settings
        // A simpler way is to find conversations with disappearing mode and delete their old messages
        const configs = await prisma.conversationUserSetting.findMany({
            where: {
                disappearingMode: { not: 'off' }
            }
        });

        for (const config of configs) {
            let limitDate;
            if (config.disappearingMode === '1h') limitDate = oneHourAgo;
            else if (config.disappearingMode === '24h') limitDate = oneDayAgo;
            else if (config.disappearingMode === '7d') limitDate = sevenDaysAgo;

            if (limitDate) {
                const deleted = await prisma.message.deleteMany({
                    where: {
                        conversationId: config.conversationId,
                        createdAt: { lt: limitDate }
                    }
                });
                if (deleted.count > 0) {
                    console.log(`[Cleanup] Deleted ${deleted.count} messages for conversation ${config.conversationId} (${config.disappearingMode})`);
                }
            }
        }
        console.log('[Cleanup] Finished successfully.');
    } catch (err) {
        console.error('[Cleanup] Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();
