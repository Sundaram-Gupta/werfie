import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({datasources:{db:{url:'postgresql://postgres:root@localhost:5432/xclone_db'}}});

async function run() {
    try {
        console.log("Creating conversation...");
        // User 1
        const u1 = '0000cc93-b40a-43d8-be87-3defc5e3b0fa';
        // User 2
        const u2 = '0001f475-39f8-4865-a2b6-75ad3b39fc09';
        
        // Existing conv
        const convId = 'f840936d-47da-4ea2-abf1-e3936df3ebb5';

        console.log("Creating message...");
        const msg = await prisma.message.create({
            data: {
                senderId: u1,
                conversationId: convId,
                content: 'Prisma test message'
            }
        });
        console.log("Msg created with ID:", msg.id);

        console.log("Hiding message...");
        await prisma.hiddenMessage.create({
            data: {
                messageId: msg.id,
                userId: u1
            }
        });
        
        console.log("Checking DB after hiding...");
        const check = await prisma.message.findUnique({ where: { id: msg.id }});
        console.log("Does the message STILL EXIST in DB?:", !!check);

        // Check Hidden entries
        const hideEntries = await prisma.hiddenMessage.findMany({ where: { messageId: msg.id } });
        console.log("Hidden entries count:", hideEntries.length);
        
    } catch(e) {
        console.log("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
