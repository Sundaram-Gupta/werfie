import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({datasources:{db:{url:'postgresql://xclone:xclone_dev_password@localhost:5433/xclone_db?connect_timeout=5'}}});
async function probe() {
    const convs = await prisma.conversation.count();
    const msgs = await prisma.message.count();
    const users = await prisma.user.count();
    console.log(`Real Probe results - Convs: ${convs}, Msgs: ${msgs}, Users: ${users}`);
    
    // Check for the messages I hid earlier!
    const msgId = '5b1cc623-f563-404e-a65a-3111430a6b65';
    const msg = await prisma.message.findUnique({ where: { id: msgId }});
    console.log(`Msg ${msgId} exists?:`, !!msg);
    
    const hidden = await prisma.hiddenMessage.findMany({ where: { messageId: msgId } });
    console.log(`Hidden records for ${msgId}:`, hidden);
}
probe().finally(() => prisma.$disconnect());
